import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthProvider } from '../entities/auth-provider.entity.js';
import { Device } from '../entities/device.entity.js';
import { UserIdentity } from '../entities/identity.entity.js';
import { LoginAuditLog } from '../entities/login-audit-log.entity.js';
import { MembershipRole } from '../entities/membership-role.entity.js';
import { Membership } from '../entities/membership.entity.js';
import { MfaFactor } from '../entities/mfa-factor.entity.js';
import { MfaRecoveryCode } from '../entities/mfa-recovery-code.entity.js';
import { OAuthToken } from '../entities/oauth-token.entity.js';
import { Organization } from '../entities/organization.entity.js';
import { PasskeyCredential } from '../entities/passkey-credential.entity.js';
import { PasswordCredential } from '../entities/password-credential.entity.js';
import { Permission } from '../entities/permission.entity.js';
import { RefreshToken } from '../entities/refresh-token.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { Role } from '../entities/role.entity.js';
import { Session } from '../entities/session.entity.js';
import { UserEmail } from '../entities/user-email.entity.js';
import { UserPhoneNumber } from '../entities/user-phone.entity.js';
import { UserEntity } from '../entities/user.entity.js';
import { VerificationToken } from '../entities/verification-token.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthProvider,
      Device,
      LoginAuditLog,
      Membership,
      MembershipRole,
      MfaFactor,
      MfaRecoveryCode,
      OAuthToken,
      Organization,
      PasskeyCredential,
      PasswordCredential,
      Permission,
      RefreshToken,
      Role,
      RolePermission,
      Session,
      UserEmail,
      UserEntity,
      UserIdentity,
      UserPhoneNumber,
      VerificationToken,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class IdentityModule {}