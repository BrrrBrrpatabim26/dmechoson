import { Injectable } from '@nestjs/common';
import { BaseMailSenderStrategy } from '../../../core/abstracts/base-mail-sender-strategy.abstract.js';
import type { SendMailOptions } from '../../../core/interfaces/mail-sender-strategy.interface.js';

/**
 * Chiến lược gửi Email ra Console (Mặc định cho Dev, Test và Docker).
 *
 * In trực tiếp mã OTP hoặc Magic Link ra terminal log để kiểm thử tức thì
 * mà không cần phải cấu hình tài khoản SMTP thực tế từ bên ngoài.
 */
@Injectable()
export class ConsoleMailSenderStrategy extends BaseMailSenderStrategy {
  constructor() {
    super('console');
  }

  async sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string }> {
    const divider = '='.repeat(60);
    this.logger.log(`\n${divider}\n[GỬI EMAIL MÔ PHỎNG - CONSOLE STRATEGY]`);
    this.logger.log(`Người nhận: ${options.to}`);
    this.logger.log(`Tiêu đề:    ${options.subject}`);
    if (options.text) {
      this.logger.log(`Nội dung:\n${options.text}`);
    }
    if (options.html) {
      this.logger.log(`Nội dung HTML (Rút gọn):\n${options.html.substring(0, 300)}...`);
    }
    this.logger.log(`${divider}\n`);

    return {
      success: true,
      messageId: `console-msg-${Date.now()}`,
    };
  }
}
