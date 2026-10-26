import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INJECTION_TOKENS } from '../core/tokens/injection.tokens.js';
import { UserEntity } from '../entities/user.entity.js';
import { UserEmail } from '../entities/user-email.entity.js';
import { AuthProvider } from '../entities/auth-provider.entity.js';
import { UserIdentity } from '../entities/identity.entity.js';
import { PasswordCredential } from '../entities/password-credential.entity.js';
import { Session } from '../entities/session.entity.js';
import { RefreshToken } from '../entities/refresh-token.entity.js';
import { Device } from '../entities/device.entity.js';
import { LoginAuditLog } from '../entities/login-audit-log.entity.js';
import { Role } from '../entities/role.entity.js';
import { Permission } from '../entities/permission.entity.js';
import { Membership } from '../entities/membership.entity.js';
import { MembershipRole } from '../entities/membership-role.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { VerificationToken } from '../entities/verification-token.entity.js';
import { OAuthToken } from '../entities/oauth-token.entity.js';
import { MfaFactor } from '../entities/mfa-factor.entity.js';
import { MfaRecoveryCode } from '../entities/mfa-recovery-code.entity.js';
import { PasskeyCredential } from '../entities/passkey-credential.entity.js';

import { UserRepository } from './user.repository.js';
import { UserEmailRepository } from './user-email.repository.js';
import { AuthProviderRepository } from './auth-provider.repository.js';
import { IdentityRepository } from './identity.repository.js';
import { PasswordCredentialRepository } from './password-credential.repository.js';
import { SessionRepository } from './session.repository.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { DeviceRepository } from './device.repository.js';
import { LoginAuditLogRepository } from './login-audit-log.repository.js';
import { RbacRepository } from './rbac.repository.js';
import { VerificationTokenRepository } from './verification-token.repository.js';
import { OAuthTokenRepository } from './oauth-token.repository.js';
import { MfaFactorRepository, MfaRecoveryCodeRepository } from './mfa.repository.js';
import { PasskeyCredentialRepository } from './passkey-credential.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserEmail,
      AuthProvider,
      UserIdentity,
      PasswordCredential,
      Session,
      RefreshToken,
      Device,
      LoginAuditLog,
      Role,
      Permission,
      Membership,
      MembershipRole,
      RolePermission,
      VerificationToken,
      OAuthToken,
      MfaFactor,
      MfaRecoveryCode,
      PasskeyCredential,
    ]),
  ],
  providers: [
    UserRepository,
    UserEmailRepository,
    AuthProviderRepository,
    IdentityRepository,
    PasswordCredentialRepository,
    SessionRepository,
    RefreshTokenRepository,
    DeviceRepository,
    LoginAuditLogRepository,
    RbacRepository,
    VerificationTokenRepository,
    OAuthTokenRepository,
    MfaFactorRepository,
    MfaRecoveryCodeRepository,
    PasskeyCredentialRepository,
    { provide: INJECTION_TOKENS.USER_REPOSITORY, useExisting: UserRepository },
    { provide: INJECTION_TOKENS.USER_EMAIL_REPOSITORY, useExisting: UserEmailRepository },
    { provide: INJECTION_TOKENS.AUTH_PROVIDER_REPOSITORY, useExisting: AuthProviderRepository },
    { provide: INJECTION_TOKENS.IDENTITY_REPOSITORY, useExisting: IdentityRepository },
    {
      provide: INJECTION_TOKENS.PASSWORD_CREDENTIAL_REPOSITORY,
      useExisting: PasswordCredentialRepository,
    },
    { provide: INJECTION_TOKENS.SESSION_REPOSITORY, useExisting: SessionRepository },
    { provide: INJECTION_TOKENS.REFRESH_TOKEN_REPOSITORY, useExisting: RefreshTokenRepository },
    { provide: INJECTION_TOKENS.DEVICE_REPOSITORY, useExisting: DeviceRepository },
    { provide: INJECTION_TOKENS.LOGIN_AUDIT_LOG_REPOSITORY, useExisting: LoginAuditLogRepository },
    { provide: INJECTION_TOKENS.RBAC_REPOSITORY, useExisting: RbacRepository },
    {
      provide: INJECTION_TOKENS.VERIFICATION_TOKEN_REPOSITORY,
      useExisting: VerificationTokenRepository,
    },
    {
      provide: INJECTION_TOKENS.OAUTH_TOKEN_REPOSITORY,
      useExisting: OAuthTokenRepository,
    },
    { provide: INJECTION_TOKENS.MFA_FACTOR_REPOSITORY, useExisting: MfaFactorRepository },
    { provide: INJECTION_TOKENS.MFA_RECOVERY_CODE_REPOSITORY, useExisting: MfaRecoveryCodeRepository },
    { provide: INJECTION_TOKENS.PASSKEY_CREDENTIAL_REPOSITORY, useExisting: PasskeyCredentialRepository },
  ],
  exports: [
    UserRepository,
    UserEmailRepository,
    AuthProviderRepository,
    IdentityRepository,
    PasswordCredentialRepository,
    SessionRepository,
    RefreshTokenRepository,
    DeviceRepository,
    LoginAuditLogRepository,
    RbacRepository,
    VerificationTokenRepository,
    OAuthTokenRepository,
    MfaFactorRepository,
    MfaRecoveryCodeRepository,
    PasskeyCredentialRepository,
    INJECTION_TOKENS.USER_REPOSITORY,
    INJECTION_TOKENS.USER_EMAIL_REPOSITORY,
    INJECTION_TOKENS.AUTH_PROVIDER_REPOSITORY,
    INJECTION_TOKENS.IDENTITY_REPOSITORY,
    INJECTION_TOKENS.PASSWORD_CREDENTIAL_REPOSITORY,
    INJECTION_TOKENS.SESSION_REPOSITORY,
    INJECTION_TOKENS.REFRESH_TOKEN_REPOSITORY,
    INJECTION_TOKENS.DEVICE_REPOSITORY,
    INJECTION_TOKENS.LOGIN_AUDIT_LOG_REPOSITORY,
    INJECTION_TOKENS.RBAC_REPOSITORY,
    INJECTION_TOKENS.VERIFICATION_TOKEN_REPOSITORY,
    INJECTION_TOKENS.OAUTH_TOKEN_REPOSITORY,
    INJECTION_TOKENS.MFA_FACTOR_REPOSITORY,
    INJECTION_TOKENS.MFA_RECOVERY_CODE_REPOSITORY,
    INJECTION_TOKENS.PASSKEY_CREDENTIAL_REPOSITORY,
  ],
})
export class RepositoryModule {}
