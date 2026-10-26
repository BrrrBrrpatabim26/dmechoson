import { UserEntity } from '../../entities/user.entity.js';
import { UserEmail } from '../../entities/user-email.entity.js';
import { AuthProvider } from '../../entities/auth-provider.entity.js';
import { UserIdentity } from '../../entities/identity.entity.js';
import { PasswordCredential } from '../../entities/password-credential.entity.js';
import { Session } from '../../entities/session.entity.js';
import { RefreshToken } from '../../entities/refresh-token.entity.js';
import { Device } from '../../entities/device.entity.js';
import { LoginAuditLog } from '../../entities/login-audit-log.entity.js';
import { Role } from '../../entities/role.entity.js';
import { Permission } from '../../entities/permission.entity.js';

export type UserUpdateInput = Partial<
  Omit<UserEntity, 'emails' | 'phoneNumbers' | 'userIdentities'>
>;

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  create(user: Partial<UserEntity>): Promise<UserEntity>;
  update(id: string, partial: UserUpdateInput): Promise<void>;
  updateLastLogin(id: string, date?: Date): Promise<void>;
}

export interface IUserEmailRepository {
  findByEmail(email: string): Promise<UserEmail | null>;
  findByUserId(userId: string): Promise<UserEmail[]>;
  create(userEmail: Partial<UserEmail>): Promise<UserEmail>;
  markAsVerified(id: string): Promise<void>;
}

export interface IAuthProviderRepository {
  findByCode(code: string): Promise<AuthProvider | null>;
  findOrCreate(code: string, kind: string, displayName: string): Promise<AuthProvider>;
}

export interface IIdentityRepository {
  findByProviderAndSubject(providerId: string, providerUserId: string): Promise<UserIdentity | null>;
  findByUserId(userId: string): Promise<UserIdentity[]>;
  create(identity: Partial<UserIdentity>): Promise<UserIdentity>;
  updateLastLogin(id: string, date?: Date): Promise<void>;
}

export interface IPasswordCredentialRepository {
  findByIdentityId(identityId: string): Promise<PasswordCredential | null>;
  create(credential: Partial<PasswordCredential>): Promise<PasswordCredential>;
  updatePassword(identityId: string, passwordHash: string, hashAlgorithm: string): Promise<void>;
  recordFailedAttempt(
    identityId: string,
    maxAttempts?: number,
    lockDurationMinutes?: number,
  ): Promise<{ failedAttempts: number; isLocked: boolean; lockedUntil: Date | null }>;
  resetFailedAttempts(identityId: string): Promise<void>;
}

export interface ISessionRepository {
  create(session: Partial<Session>): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findActiveById(id: string): Promise<Session | null>;
  findActiveSessionsByUserId(userId: string): Promise<Session[]>;
  updateLastSeen(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string, exceptSessionId?: string): Promise<void>;
}

export interface IRefreshTokenRepository {
  create(token: Partial<RefreshToken>): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  markAsUsed(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
  revokeSessionChain(sessionId: string): Promise<void>;
}

export interface IDeviceRepository {
  findOrCreate(userId: string, userAgent?: string, label?: string): Promise<Device>;
}

export interface AuditLogQueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ILoginAuditLogRepository {
  record(log: Partial<LoginAuditLog>): Promise<LoginAuditLog>;
  findByUserId(
    userId: string,
    options?: AuditLogQueryOptions,
  ): Promise<{ items: LoginAuditLog[]; total: number }>;
}

export interface IRbacRepository {
  findRolesByUserId(userId: string): Promise<Role[]>;
  findPermissionsByRoleIds(roleIds: string[]): Promise<Permission[]>;
  findOrCreateRole(name: string, isSystem?: boolean, description?: string): Promise<Role>;
  findOrCreatePermission(code: string, description?: string): Promise<Permission>;
  assignRoleToUser(userId: string, roleId: string, orgId?: string | null): Promise<void>;

  // Quản trị RBAC (admin API + bootstrap seeding)
  findRoleByName(name: string): Promise<Role | null>;
  findRoleById(roleId: string): Promise<Role | null>;
  listRoles(): Promise<Role[]>;
  findPermissionsByRoleId(roleId: string): Promise<Permission[]>;
  findPermissionByCode(code: string): Promise<Permission | null>;
  linkRolePermission(roleId: string, permissionId: string): Promise<void>;
  unlinkRolePermission(roleId: string, permissionId: string): Promise<boolean>;
  removeRoleFromUser(userId: string, roleId: string): Promise<boolean>;
  countUsersWithRole(roleId: string): Promise<number>;
  deleteRole(roleId: string): Promise<boolean>;
}
