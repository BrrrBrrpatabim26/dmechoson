import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSecret, generateURI, verify as verifyOtpToken } from 'otplib';
import * as crypto from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import { AesGcmCipher, sha256Hex, timingSafeEqualStr } from '../../common/utils/crypto.util.js';
import type { IMfaFactorRepository, IMfaRecoveryCodeRepository } from '../../core/interfaces/mfa-repository.interface.js';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';

export interface TotpSetupResult {
  factorId: string;
  secret: string;
  otpauthUrl: string;
  label: string;
}

/**
 * Dịch vụ MFA/TOTP (RFC 6238) dùng otplib.
 *
 * - Secret TOTP được mã hóa AES-256-GCM trước khi ghi xuống bảng mfa_factors (secret_enc bytea).
 * - Recovery codes chỉ lưu hash SHA-256, dùng một lần.
 * - Luồng: setup (isEnabled=false, chờ verify) -> verify (bật factor + phát hành recovery codes).
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly cipher: AesGcmCipher;
  private readonly issuer: string;
  private readonly recoveryCodeCount: number;

  constructor(
    @Inject(INJECTION_TOKENS.MFA_FACTOR_REPOSITORY)
    private readonly factorRepo: IMfaFactorRepository,

    @Inject(INJECTION_TOKENS.MFA_RECOVERY_CODE_REPOSITORY)
    private readonly recoveryRepo: IMfaRecoveryCodeRepository,

    configService: ConfigService,
  ) {
    // S7: production BẮT BUỘC khóa chuyên dụng MFA_ENCRYPTION_KEY — cấm ngầm reuse
    // khóa ký JWT (JWT_SECRET) làm khóa mã hóa. Thiếu khóa -> dừng khởi động, nêu tên biến (AGENTS 5.2/5.4).
    const dedicatedKey = configService.get<string>('mfa.encryptionKey');
    if (process.env.NODE_ENV === 'production' && !dedicatedKey) {
      throw new Error(
        'Thiếu cấu hình bắt buộc MFA_ENCRYPTION_KEY khi NODE_ENV=production - khong fallback sang JWT_SECRET. Khai bao khoa ngau nhien >= 32 ky tu trong secret manager.',
      );
    }
    // Non-production được phép fallback JWT_SECRET (tiện cho dev/test); khuyến nghị đặt khóa riêng.
    const key = dedicatedKey || configService.getOrThrow<string>('jwt.secret');
    this.cipher = new AesGcmCipher(key);
    this.issuer = configService.get<string>('mfa.issuer', 'AgentCloud Auth');
    this.recoveryCodeCount = configService.get<number>('mfa.recoveryCodeCount', 8);
  }

  /**
   * Khởi tạo TOTP: sinh secret, lưu mã hóa (chưa bật), trả otpauth URL cho client vẽ QR.
   */
  async setupTotp(userId: string, accountLabel: string): Promise<TotpSetupResult> {
    const existing = await this.factorRepo.findTotpByUserId(userId);
    if (existing?.isEnabled) {
      throw new BadRequestException('Tài khoản đã bật MFA bằng TOTP. Hãy tắt factor cũ trước khi cấu hình lại.');
    }

    const secret = generateSecret({ length: 20 });
    const secretEnc = this.cipher.encrypt(secret);
    const label = accountLabel || `user-${userId}`;

    const factor = existing
      ? await (async () => {
          await this.factorRepo.update({ id: existing.id, secretEnc });
          return existing;
        })()
      : await this.factorRepo.create({
          id: uuidv7(),
          userId,
          type: 'totp',
          label: 'Authenticator App',
          secretEnc,
          isEnabled: false,
        });

    const otpauthUrl = generateURI({
      issuer: this.issuer,
      label,
      secret,
    });

    this.logger.log(`User [${userId}] khởi tạo TOTP factor [${factor.id}]`);
    return { factorId: factor.id, secret, otpauthUrl, label };
  }

  /**
   * Tài khoản có yếu tố TOTP đang BẬT không — dùng cho bước enforcement MFA khi đăng nhập.
   */
  async isTotpEnabled(userId: string): Promise<boolean> {
    const factor = await this.factorRepo.findTotpByUserId(userId);
    return factor?.isEnabled === true;
  }

  /**
   * Xác minh mã TOTP. Lần verify thành công đầu tiên sẽ bật factor và phát hành recovery codes.
   */
  async verifyTotp(
    userId: string,
    code: string,
  ): Promise<{ valid: boolean; recoveryCodes?: string[] }> {
    const factor = await this.factorRepo.findTotpByUserId(userId);
    if (!factor || !factor.secretEnc) {
      throw new NotFoundException('Tài khoản chưa cấu hình TOTP. Hãy gọi endpoint setup trước.');
    }

    const secret = this.cipher.decrypt(factor.secretEnc);
    const result = await verifyOtpToken({ secret, token: code.trim(), epochTolerance: 30 });

    if (!result.valid) {
      throw new BadRequestException('Mã TOTP không chính xác hoặc đã hết hạn hiệu lực.');
    }

    // Verify thành công: bật factor + phát hành recovery codes nếu chưa có
    if (!factor.isEnabled) {
      await this.factorRepo.update({
        id: factor.id,
        isEnabled: true,
        verifiedAt: new Date(),
        lastUsedAt: new Date(),
      });
      const recoveryCodes = await this.generateRecoveryCodes(userId);
      this.logger.log(`User [${userId}] đã bật MFA/TOTP thành công`);
      return { valid: true, recoveryCodes };
    }

    await this.factorRepo.update({ id: factor.id, lastUsedAt: new Date() });
    return { valid: true };
  }

  /**
   * Danh sách phương thức MFA đang bật + số mã phục hồi còn lại.
   */
  async listFactors(userId: string): Promise<{
    factors: { id: string; type: string; label: string | null; isEnabled: boolean; verifiedAt: Date | null }[];
    remainingRecoveryCodes: number;
  }> {
    const factors = await this.factorRepo.findEnabledFactorsByUserId(userId);
    const unusedCodes = await this.recoveryRepo.findUnusedByUserId(userId);

    return {
      factors: factors.map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        isEnabled: f.isEnabled,
        verifiedAt: f.verifiedAt,
      })),
      remainingRecoveryCodes: unusedCodes.length,
    };
  }

  /**
   * Tắt (xóa cấu hình) một factor MFA thuộc sở hữu người dùng hiện tại.
   */
  async disableFactor(userId: string, factorId: string): Promise<void> {
    const factor = await this.factorRepo.findById(factorId);
    if (!factor || factor.userId !== userId) {
      throw new NotFoundException('Không tìm thấy yếu tố MFA hoặc không thuộc tài khoản của bạn');
    }

    await this.factorRepo.disable(factorId);
    await this.recoveryRepo.deleteAllForUser(userId);
    this.logger.log(`User [${userId}] đã tắt yếu tố MFA [${factorId}]`);
  }

  /**
   * Xác minh mã phục hồi (dùng một lần).
   */
  async verifyRecoveryCode(userId: string, code: string): Promise<{ valid: boolean; remaining: number }> {
    const normalized = code.trim().toUpperCase();
    const hash = sha256Hex(normalized);
    const unused = await this.recoveryRepo.findUnusedByUserId(userId);

    const matched = unused.find((c) => timingSafeEqualStr(c.codeHash, hash));
    if (!matched) {
      throw new BadRequestException('Mã phục hồi không đúng hoặc đã được sử dụng.');
    }

    await this.recoveryRepo.markUsed(matched.id);
    return { valid: true, remaining: unused.length - 1 };
  }

  private async generateRecoveryCodes(userId: string): Promise<string[]> {
    await this.recoveryRepo.deleteAllForUser(userId);

    const codes: string[] = [];
    for (let i = 0; i < this.recoveryCodeCount; i += 1) {
      codes.push(
        `${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      );
    }

    await this.recoveryRepo.createMany(
      codes.map((code) => ({
        id: uuidv7(),
        userId,
        codeHash: sha256Hex(code.toUpperCase()),
      })),
    );

    return codes;
  }
}
