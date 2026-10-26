import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IMailSenderStrategy,
  SendMailOptions,
} from '../../core/interfaces/mail-sender-strategy.interface.js';
import { ConsoleMailSenderStrategy } from './strategies/console-mail.strategy.js';
import { SmtpMailSenderStrategy } from './strategies/smtp-mail.strategy.js';

/**
 * Service quản lý gửi Email đa hình (Polymorphic Mail Dispatcher).
 *
 * Cho phép chuyển đổi chiến lược gửi mail (Console vs SMTP) tự động theo biến môi trường MAIL_STRATEGY.
 */
@Injectable()
export class MailSenderService implements IMailSenderStrategy {
  private readonly logger = new Logger(MailSenderService.name);
  private activeStrategy: IMailSenderStrategy;
  private readonly strategies = new Map<string, IMailSenderStrategy>();

  constructor(
    private readonly configService: ConfigService,
    consoleStrategy: ConsoleMailSenderStrategy,
    smtpStrategy: SmtpMailSenderStrategy,
  ) {
    this.strategies.set('console', consoleStrategy);
    this.strategies.set('smtp', smtpStrategy);

    const configured = (
      this.configService.get<string>('mail.strategy', process.env.MAIL_STRATEGY || 'console')
    ).toLowerCase();

    this.activeStrategy = this.strategies.get(configured) || consoleStrategy;
    this.logger.log(`MailSenderService khởi tạo với chiến lược hoạt động: [${this.activeStrategy.name}]`);
  }

  get name(): string {
    return this.activeStrategy.name;
  }

  setStrategy(strategyName: string): void {
    const found = this.strategies.get(strategyName.toLowerCase());
    if (found) {
      this.activeStrategy = found;
      this.logger.log(`Đã chuyển đổi chiến lược gửi mail sang: [${this.activeStrategy.name}]`);
    } else {
      this.logger.warn(`Chiến lược [${strategyName}] không tồn tại. Giữ nguyên [${this.activeStrategy.name}]`);
    }
  }

  async sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string }> {
    return this.activeStrategy.sendMail(options);
  }
}
