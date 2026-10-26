import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RepositoryModule } from '../../repositories/repository.module.js';
import { HashingModule } from '../hashing/hashing.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { TokenModule } from '../token/token.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { VerificationModule } from '../verification/verification.module.js';
import { AuthV1Controller } from './controllers/auth-v1.controller.js';
import { AuthV2Controller } from './controllers/auth-v2.controller.js';
import { AuthService } from './auth.service.js';
import { OAuthController } from '../oauth/oauth.controller.js';
import { OAuthService } from '../oauth/oauth.service.js';
import { GoogleOAuthStrategy } from '../oauth/strategies/google-oauth.strategy.js';
import { GitHubOAuthStrategy } from '../oauth/strategies/github-oauth.strategy.js';
import { GoogleOAuthGuard } from '../oauth/guards/google-oauth.guard.js';
import { GitHubOAuthGuard } from '../oauth/guards/github-oauth.guard.js';
import { MfaController } from '../mfa/mfa.controller.js';
import { MfaService } from '../mfa/mfa.service.js';
import { PasskeyService } from '../mfa/passkey.service.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    HashingModule,
    TokenModule,
    RbacModule,
    RepositoryModule,
    NotificationModule,
    VerificationModule,
  ],
  controllers: [AuthV1Controller, AuthV2Controller, OAuthController, MfaController],
  providers: [
    AuthService,
    JwtAuthGuard,
    PermissionsGuard,
    RolesGuard,
    // OAuth (Google / GitHub)
    OAuthService,
    GoogleOAuthStrategy,
    GitHubOAuthStrategy,
    GoogleOAuthGuard,
    GitHubOAuthGuard,
    // MFA / TOTP & Passkey
    MfaService,
    PasskeyService,
    {
      provide: INJECTION_TOKENS.AUTH_SERVICE,
      useExisting: AuthService,
    },
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    PermissionsGuard,
    RolesGuard,
    INJECTION_TOKENS.AUTH_SERVICE,
  ],
})
export class AuthModule {}
