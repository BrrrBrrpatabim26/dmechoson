import { Inject, Injectable, Logger } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import type { IMailSenderStrategy } from '../../core/interfaces/mail-sender-strategy.interface.js';
import type { IVerificationTokenRepository } from '../../core/interfaces/verification-token.interface.js';
import type { IOtpService } from '../../core/interfaces/otp-service.interface.js';
import { NumericOtpStrategy } from './strategies/numeric-otp.strategy.js';
import { MagicLinkStrategy } from './strategies/magic-link.strategy.js';
import {
  OtpExpiredException,
  OtpInvalidException,
  OtpMaxAttemptsExceededException,
} from '../../common/exceptions/auth.exceptions.js';

@Injectable()
export class VerificationService implements IOtpService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @Inject(INJECTION_TOKENS.VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepo: IVerificationTokenRepository,

    @Inject(INJECTION_TOKENS.MAIL_SENDER)
    private readonly mailSender: IMailSenderStrategy,

    private readonly numericOtpStrategy: NumericOtpStrategy,
    private readonly magicLinkStrategy: MagicLinkStrategy,
  ) {}

  async sendOtp(
    target: string,
    channel: 'email' | 'sms',
    purpose: string = 'signin',
    ip?: string,
  ): Promise<{ expiresInSeconds: number; target: string }> {
    const normalizedTarget = target.trim().toLowerCase();

    // Hủy các mã OTP cũ đang chờ của target này để tránh trùng lặp
    await this.tokenRepo.revokeAllForTarget(normalizedTarget, purpose);

    // Sinh mã OTP 6 số (thời hạn 5 phút)
    const { rawToken, tokenHash, expiresAt } = this.numericOtpStrategy.generate(5);

    await this.tokenRepo.create({
      target: normalizedTarget,
      channel,
      purpose,
      tokenType: 'otp',
      tokenHash,
      expiresAt,
      ip,
    });

    if (channel === 'email') {
      // S6: KHONG đặt mã OTP thô vào Subject — subject bị lặp lại ở nhiều log/preview mail client;
      // mã chỉ xuất hiện trong body thư (text + html).
      await this.mailSender.sendMail({
        to: normalizedTarget,
        subject: '[AgentCloud] Ma xac thuc OTP cua ban',
        text: `Mã xác thực OTP của bạn là: ${rawToken}. Mã có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Xác thực Danh tính - AgentCloud</h2>
            <p>Mã xác thực OTP của bạn là:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; margin: 15px 0;">
              ${rawToken}
            </div>
            <p>Mã có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
          </div>
        `,
      });
    } else {
      this.logger.log(`[SMS OTP SIMULATION] Gửi SMS OTP [${rawToken}] tới số điện thoại: ${normalizedTarget}`);
    }

    return {
      expiresInSeconds: 300,
      target: normalizedTarget,
    };
  }

  async verifyOtp(
    target: string,
    rawOtp: string,
    purpose: string = 'signin',
  ): Promise<{ valid: boolean; userId: string | null }> {
    const normalizedTarget = target.trim().toLowerCase();
    const token = await this.tokenRepo.findActiveByTarget(normalizedTarget, purpose, 'otp');

    if (!token) {
      throw new OtpExpiredException('Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng gửi lại mã mới.');
    }

    if (token.attempts >= token.maxAttempts) {
      await this.tokenRepo.consume(token.id);
      throw new OtpMaxAttemptsExceededException();
    }

    const isValid = this.numericOtpStrategy.verify(rawOtp.trim(), token.tokenHash);

    if (!isValid) {
      const attempts = await this.tokenRepo.incrementAttempts(token.id);
      if (attempts >= token.maxAttempts) {
        await this.tokenRepo.consume(token.id);
        throw new OtpMaxAttemptsExceededException();
      }
      throw new OtpInvalidException(`Mã OTP không chính xác. Bạn còn ${token.maxAttempts - attempts} lần thử.`);
    }

    // Đánh dấu đã sử dụng để chống Replay Attack
    await this.tokenRepo.consume(token.id);
    return {
      valid: true,
      userId: token.userId,
    };
  }

  async sendMagicLink(
    email: string,
    clientBaseUrl: string,
    ip?: string,
  ): Promise<{ expiresInSeconds: number; target: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    // Hủy các Magic link cũ đang chờ
    await this.tokenRepo.revokeAllForTarget(normalizedEmail, 'magic_link');

    // Sinh 32 bytes URL token (15 phút)
    const { rawToken, tokenHash, expiresAt } = this.magicLinkStrategy.generate(15);

    await this.tokenRepo.create({
      target: normalizedEmail,
      channel: 'email',
      purpose: 'magic_link',
      tokenType: 'magic_link',
      tokenHash,
      expiresAt,
      ip,
    });

    const magicUrl = `${clientBaseUrl.replace(/\/$/, '')}/auth/magic-link/verify?token=${rawToken}`;

    await this.mailSender.sendMail({
      to: normalizedEmail,
      subject: '[AgentCloud] Đường dẫn đăng nhập nhanh (Magic Link)',
      text: `Nhấp vào liên kết sau để đăng nhập nhanh vào tài khoản: ${magicUrl}. Liên kết có hiệu lực trong 15 phút.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Đăng nhập Nhanh - AgentCloud</h2>
          <p>Nhấp vào nút bên dưới để hoàn tất đăng nhập mà không cần mật khẩu:</p>
          <div style="margin: 25px 0;">
            <a href="${magicUrl}" style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Đăng nhập vào AgentCloud
            </a>
          </div>
          <p>Hoặc sao chép đường dẫn này vào trình duyệt: <br><a href="${magicUrl}">${magicUrl}</a></p>
          <p style="color: #666; font-size: 13px;">Liên kết có hiệu lực trong vòng 15 phút.</p>
        </div>
      `,
    });

    return {
      expiresInSeconds: 900,
      target: normalizedEmail,
    };
  }

  async verifyMagicLink(
    rawToken: string,
  ): Promise<{ valid: boolean; email: string; userId: string | null }> {
    const tokenHash = this.magicLinkStrategy.hashToken(rawToken.trim());
    const token = await this.tokenRepo.findByTokenHash(tokenHash);

    if (!token) {
      throw new OtpExpiredException('Đường dẫn đăng nhập nhanh không hợp lệ hoặc đã hết hạn.');
    }

    // Đánh dấu đã sử dụng
    await this.tokenRepo.consume(token.id);

    return {
      valid: true,
      email: token.target,
      userId: token.userId,
    };
  }

  /**
   * Gửi email xác minh địa chỉ email (Email Verification).
   * Dùng token 32 bytes băm SHA-256, hiệu lực 24 giờ, purpose = 'verify_email'.
   */
  async sendVerificationEmail(
    email: string,
    userId: string,
    clientBaseUrl: string,
    ip?: string,
  ): Promise<{ expiresInSeconds: number; target: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    // Hủy các link xác minh cũ đang chờ của email này
    await this.tokenRepo.revokeAllForTarget(normalizedEmail, 'verify_email');

    // Sinh token 32 bytes, hiệu lực 24 giờ (1440 phút)
    const { rawToken, tokenHash, expiresAt } = this.magicLinkStrategy.generate(1440);

    await this.tokenRepo.create({
      target: normalizedEmail,
      channel: 'email',
      purpose: 'verify_email',
      tokenType: 'magic_link',
      tokenHash,
      userId,
      expiresAt,
      ip,
    });

    const verifyUrl = `${clientBaseUrl.replace(/\/$/, '')}/auth/email/verify?token=${rawToken}`;

    await this.mailSender.sendMail({
      to: normalizedEmail,
      subject: '[AgentCloud] Xác minh địa chỉ email của bạn',
      text: `Nhấp vào liên kết sau để xác minh email (hiệu lực 24 giờ): ${verifyUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Xác Minh Email - AgentCloud</h2>
          <p>Cảm ơn bạn đã đăng ký! Nhấp vào nút bên dưới để xác minh địa chỉ email của bạn:</p>
          <div style="margin: 25px 0;">
            <a href="${verifyUrl}" style="background-color: #16a34a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Xác minh email ngay
            </a>
          </div>
          <p>Hoặc sao chép đường dẫn này vào trình duyệt: <br><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p style="color: #666; font-size: 13px;">Liên kết có hiệu lực trong vòng 24 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        </div>
      `,
    });

    this.logger.log(`Đã gửi email xác minh tới ${normalizedEmail} (user: ${userId})`);

    return {
      expiresInSeconds: 86400,
      target: normalizedEmail,
    };
  }

  /**
   * Xác thực token xác minh email. Trả về email tương ứng để layer nghiệp vụ đánh dấu verified.
   */
  async verifyEmailToken(
    rawToken: string,
  ): Promise<{ valid: boolean; email: string; userId: string | null }> {
    const tokenHash = this.magicLinkStrategy.hashToken(rawToken.trim());
    const token = await this.tokenRepo.findByTokenHash(tokenHash);

    if (!token || token.purpose !== 'verify_email') {
      throw new OtpExpiredException('Link xác minh email không hợp lệ hoặc đã hết hạn.');
    }

    // Đánh dấu đã sử dụng, chống Replay Attack
    await this.tokenRepo.consume(token.id);

    return {
      valid: true,
      email: token.target,
      userId: token.userId,
    };
  }
}
