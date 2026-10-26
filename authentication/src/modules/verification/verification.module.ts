import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RepositoryModule } from '../../repositories/repository.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { NumericOtpStrategy } from './strategies/numeric-otp.strategy.js';
import { MagicLinkStrategy } from './strategies/magic-link.strategy.js';
import { VerificationService } from './verification.service.js';

@Module({
  imports: [ConfigModule, RepositoryModule, NotificationModule],
  providers: [
    NumericOtpStrategy,
    MagicLinkStrategy,
    VerificationService,
    {
      provide: INJECTION_TOKENS.OTP_SERVICE,
      useExisting: VerificationService,
    },
  ],
  exports: [
    VerificationService,
    INJECTION_TOKENS.OTP_SERVICE,
    NumericOtpStrategy,
    MagicLinkStrategy,
  ],
})
export class VerificationModule {}
