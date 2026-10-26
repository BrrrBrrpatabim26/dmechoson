import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { BaseMailSenderStrategy } from '../../../core/abstracts/base-mail-sender-strategy.abstract.js';
import type { SendMailOptions } from '../../../core/interfaces/mail-sender-strategy.interface.js';

/** Che mot phan email khi ghi log (giu 2 ky tu dau + domain) - giu kin PII (MFA/B15). */
function maskEmail(email: string | undefined): string {
  if (!email) return '-';
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const head = local.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(local.length - 2, 1))}${domain}`;
}

/**
 * Chiến lược gửi Email thật qua giao thức SMTP (Nodemailer).
 *
 * Kích hoạt khi MAIL_STRATEGY=smtp và cấu hình đầy đủ host, port, user, pass.
 */
@Injectable()
export class SmtpMailSenderStrategy extends BaseMailSenderStrategy {
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    super('smtp');

    const host =
      this.configService.get<string>('mail.smtp.host') ||
      this.configService.get<string>('mail.host') ||
      process.env.SMTP_HOST ||
      process.env.MAIL_HOST ||
      '';

    const envPort = process.env.SMTP_PORT || process.env.MAIL_PORT;
    const port =
      this.configService.get<number>('mail.smtp.port') ||
      this.configService.get<number>('mail.port') ||
      (envPort ? parseInt(envPort, 10) : 587);

    const user =
      this.configService.get<string>('mail.smtp.user') ||
      this.configService.get<string>('mail.user') ||
      process.env.SMTP_USER ||
      process.env.MAIL_USER ||
      '';

    const rawPass =
      this.configService.get<string>('mail.smtp.pass') ||
      this.configService.get<string>('mail.pass') ||
      process.env.SMTP_PASS ||
      process.env.MAIL_PASS ||
      '';

    // Chuẩn hóa mật khẩu ứng dụng (loại bỏ khoảng trắng nếu người dùng copy dạng 'xxxx xxxx xxxx xxxx').
    const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';

    const secure =
      this.configService.get<boolean>('mail.smtp.secure') ??
      this.configService.get<boolean>('mail.secure') ??
      (process.env.SMTP_SECURE === 'true' || process.env.MAIL_SECURE === 'true' || port === 465);

    this.fromAddress =
      this.configService.get<string>('mail.from') ||
      process.env.MAIL_FROM ||
      user ||
      'noreply@agentcloud.io';

    if (host && user) {
      const timeoutMs = Number(process.env.SMTP_TIMEOUT_MS ?? 10000);
      // Mac dinh XÁC THỰC cert TLS (an toàn, chong MITM); chi tat khi SMTP_TLS_INSECURE=true (dev/self-signed).
      const rejectUnauthorized = process.env.SMTP_TLS_INSECURE !== 'true';
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        // Timeout cho moi giai doan giao tiep (AGENTS 1.2 #10).
        connectionTimeout: timeoutMs,
        greetingTimeout: timeoutMs,
        socketTimeout: timeoutMs,
        tls: {
          rejectUnauthorized,
        },
      });
      this.logger.log(`Khởi tạo SMTP Transporter kết nối tới [${host}:${port}] với tài khoản [${maskEmail(user)}]`);
    } else {
      this.logger.warn('Chưa cấu hình đầy đủ MAIL_HOST/SMTP_HOST hoặc MAIL_USER/SMTP_USER. SMTP Transporter chưa sẵn sàng.');
    }
  }

  async sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (!this.transporter) {
      this.logger.error('Không thể gửi mail qua SMTP: Transporter chưa được cấu hình.');
      return { success: false };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`Gửi email thành công tới [${maskEmail(options.to)}] qua SMTP: ID=${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Lỗi gửi mail qua SMTP tới [${maskEmail(options.to)}]: ${(error as Error).message}`);
      return { success: false };
    }
  }
}
