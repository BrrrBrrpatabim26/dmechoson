import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { JwtTokenService } from './jwt-token.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { SessionRevocationService } from './session-revocation.service.js';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    JwtTokenService,
    JwtStrategy,
    SessionRevocationService,
    {
      provide: INJECTION_TOKENS.TOKEN_SERVICE,
      useExisting: JwtTokenService,
    },
  ],
  exports: [JwtTokenService, JwtStrategy, SessionRevocationService, INJECTION_TOKENS.TOKEN_SERVICE],
})
export class TokenModule {}
