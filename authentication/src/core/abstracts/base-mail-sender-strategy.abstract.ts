import { Logger } from '@nestjs/common';
import type {
  IMailSenderStrategy,
  SendMailOptions,
} from '../interfaces/mail-sender-strategy.interface.js';

/**
 * Lớp trừu tượng BaseMailSenderStrategy.
 *
 * Cung cấp logger và khung xử lý dùng chung cho các chiến lược gửi thư.
 */
export abstract class BaseMailSenderStrategy implements IMailSenderStrategy {
  protected readonly logger: Logger;

  constructor(readonly name: string) {
    this.logger = new Logger(`MailStrategy:${name}`);
  }

  abstract sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string }>;
}
