import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { IDatabaseConfigStrategy } from '../interfaces/database-strategy.interface.js';

// Danh sách toàn bộ 21 TypeORM Entities trong hệ thống
import { AuthProvider } from '../../entities/auth-provider.entity.js';
import { Device } from '../../entities/device.entity.js';
import { LoginAuditLog } from '../../entities/login-audit-log.entity.js';
import { Membership } from '../../entities/membership.entity.js';
import { MembershipRole } from '../../entities/membership-role.entity.js';
import { MfaFactor } from '../../entities/mfa-factor.entity.js';
import { MfaRecoveryCode } from '../../entities/mfa-recovery-code.entity.js';
import { OAuthToken } from '../../entities/oauth-token.entity.js';
import { Organization } from '../../entities/organization.entity.js';
import { PasskeyCredential } from '../../entities/passkey-credential.entity.js';
import { PasswordCredential } from '../../entities/password-credential.entity.js';
import { Permission } from '../../entities/permission.entity.js';
import { RefreshToken } from '../../entities/refresh-token.entity.js';
import { Role } from '../../entities/role.entity.js';
import { RolePermission } from '../../entities/role-permission.entity.js';
import { Session } from '../../entities/session.entity.js';
import { UserEmail } from '../../entities/user-email.entity.js';
import { UserEntity } from '../../entities/user.entity.js';
import { UserIdentity } from '../../entities/identity.entity.js';
import { UserPhoneNumber } from '../../entities/user-phone.entity.js';
import { VerificationToken } from '../../entities/verification-token.entity.js';
import { InitialSchema1729000000000 } from '../../migrations/InitialSchema.js';
import { AddVerificationTokenHashIndex1730000000000 } from '../../migrations/AddVerificationTokenHashIndex.js';

/**
 * Lớp trừu tượng BaseDatabaseConfigStrategy (Template Method Pattern).
 *
 * Quản lý tập hợp Entity dùng chung và cung cấp các phương thức chuẩn hóa tham số kết nối.
 */
export abstract class BaseDatabaseConfigStrategy implements IDatabaseConfigStrategy {
  protected readonly logger: Logger;

  constructor(public readonly supportedType: string) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Danh sách toàn bộ Entities được đăng ký với TypeORM.
   */
  protected getEntities() {
    return [
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
    ];
  }

  /**
   * Danh sách Migration đăng ký với TypeORM (chạy khi DB_RUN_MIGRATIONS=true).
   * Thu tu bat buoc: InitialSchema (sinh day du bang cho DB moi) TRUOC, cac migration
   * tai bien (index...) ve sau — TypeORM chay theo thu tu mang nay.
   */
  protected getMigrations() {
    return [InitialSchema1729000000000, AddVerificationTokenHashIndex1730000000000];
  }

  /**
   * Phương thức mẫu xây dựng cấu hình TypeORM.
   */
  buildOptions(configService: ConfigService): TypeOrmModuleOptions {
    this.validate(configService);
    this.logger.log(`Khởi tạo cấu hình TypeORM cho cơ sở dữ liệu: [${this.supportedType.toUpperCase()}]`);
    return this.buildSpecificOptions(configService);
  }

  /**
   * Phương thức trừu tượng để lớp con triển khai chi tiết cho từng loại DB.
   */
  protected abstract buildSpecificOptions(configService: ConfigService): TypeOrmModuleOptions;

  /**
   * Kiểm tra các biến bắt buộc chung.
   */
  validate(configService: ConfigService): void {
    const host = configService.get<string>('database.host');
    const database = configService.get<string>('database.database');
    const username = configService.get<string>('database.username');

    if (!host || !database || !username) {
      throw new Error(
        `[DatabaseConfigStrategy] Thiếu thông tin kết nối bắt buộc cho ${this.supportedType}: host=${host}, database=${database}, username=${username}`,
      );
    }
  }
}
