import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { ConsoleMailSenderStrategy } from './strategies/console-mail.strategy.js';
import { SmtpMailSenderStrategy } from './strategies/smtp-mail.strategy.js';
import { MailSenderService } from './mail-sender.service.js';

@Module({
  providers: [
    ConsoleMailSenderStrategy,
    SmtpMailSenderStrategy,
    MailSenderService,
    {
      provide: INJECTION_TOKENS.MAIL_SENDER,
      useExisting: MailSenderService,
    },
  ],
  exports: [MailSenderService, INJECTION_TOKENS.MAIL_SENDER],
})
export class NotificationModule {}
