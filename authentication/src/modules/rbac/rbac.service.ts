import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_USER_PERMISSIONS,
  PermissionCode,
} from '../../common/constants/permission-codes.constant.js';
import type { IRbacService, UserAccessControl } from '../../core/interfaces/rbac.interface.js';
import type { IRbacRepository } from '../../core/interfaces/repositories.interface.js';
import type { KeyValueStore } from '../../core/interfaces/cache.interface.js';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { hasSuperAdminRole, resolveSuperAdminRoles, DEFAULT_USER_ROLE_FALLBACK } from '../../common/utils/super-roles.util.js';

const CACHE_PREFIX = 'rbac:access:';

@Injectable()
export class RbacService implements IRbacService {
  /**
   * Cache quyen via KeyValueStore (in-memory hoac Redis tuy ON_REDIS) TTL ngan.
   * Bat Redis (ON_REDIS=true) giup nhe instance chia se dung mot cache -> khong lech quyen khi scale ngang.
   */
  private readonly cacheTtlSeconds: number;

  constructor(
    @Inject(INJECTION_TOKENS.RBAC_REPOSITORY)
    private readonly rbacRepo: IRbacRepository,

    @Inject(INJECTION_TOKENS.CACHE_STORE)
    private readonly cache: KeyValueStore,

    private readonly configService: ConfigService,
  ) {
    const ttlMs = this.configService.get<number>('auth.rbacCacheTtlMs', 60000);
    this.cacheTtlSeconds = Math.floor(ttlMs / 1000);
  }

  /**
   * Ten role mac dinh cap cho user moi — doc tu cau hinh (DEFAULT_USER_ROLE), khong hard-code.
   */
  private get defaultUserRoleName(): string {
    const raw = this.configService.get<string>('auth.defaultUserRole');
    return (raw && raw.trim().toUpperCase()) || DEFAULT_USER_ROLE_FALLBACK;
  }

  /** Danh sách super role theo cau hinh SUPER_ADMIN_ROLES (khong hard-code ten trong logic). */
  private get superAdminRoles(): string[] {
    return resolveSuperAdminRoles(this.configService.get<string[]>('auth.superAdminRoles'));
  }

  /**
   * Lấy quyền và vai trò của người dùng (có cache TTL qua KeyValueStore).
   */
  async getUserAccess(userId: string, _orgId?: string | null): Promise<UserAccessControl> {
    const key = `${CACHE_PREFIX}${userId}`;

    if (this.cacheTtlSeconds > 0) {
      const hit = await this.cache.get(key);
      if (hit) {
        try {
          return JSON.parse(hit) as UserAccessControl;
        } catch {
          /* cache hong -> bo qua, tai tinh */
        }
      }
    }

    const accessControl = await this.loadUserAccess(userId);

    if (this.cacheTtlSeconds > 0) {
      await this.cache.set(key, JSON.stringify(accessControl), this.cacheTtlSeconds);
    }
    return accessControl;
  }

  private async loadUserAccess(userId: string): Promise<UserAccessControl> {
    const rolesFromDb = await this.rbacRepo.findRolesByUserId(userId);

    // Nếu người dùng chưa được cấu hình vai trò riêng trong DB -> Cấp vai trò và quyền mặc định
    if (rolesFromDb.length === 0) {
      return {
        roles: [this.defaultUserRoleName],
        permissions: [...DEFAULT_USER_PERMISSIONS],
      };
    }

    const roleNames = rolesFromDb.map((r) => r.name);
    const roleIds = rolesFromDb.map((r) => r.id);

    const permissionsFromDb = await this.rbacRepo.findPermissionsByRoleIds(roleIds);
    const permissionCodes = permissionsFromDb.map((p) => p.code as PermissionCode);

    // Gộp quyền từ DB với các quyền cơ bản mặc định
    const mergedPermissions = Array.from(
      new Set([...DEFAULT_USER_PERMISSIONS, ...permissionCodes]),
    );

    return {
      roles: roleNames,
      permissions: mergedPermissions,
    };
  }

  /**
   * Khởi tạo quyền mặc định cho người dùng mới khi đăng ký.
   */
  async assignDefaultAccess(userId: string): Promise<UserAccessControl> {
    const userRole = await this.rbacRepo.findOrCreateRole(
      this.defaultUserRoleName,
      true,
      'Vai trò người dùng thông thường',
    );

    await this.rbacRepo.assignRoleToUser(userId, userRole.id);

    // Vo hieu cache de lan truy van sau doc quyen moi nhat tu DB
    await this.invalidateCache(userId);

    return {
      roles: [this.defaultUserRoleName],
      permissions: [...DEFAULT_USER_PERMISSIONS],
    };
  }

  /**
   * Xóa cache quyền của một người dùng (gọi khi thay đổi role/permission).
   */
  async invalidateCache(userId: string): Promise<void> {
    await this.cache.del(`${CACHE_PREFIX}${userId}`);
  }

  /**
   * Kiểm tra quyền nguyên tử.
   */
  hasPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    if (userPermissions.includes('*')) {
      return true;
    }
    return requiredPermissions.every((perm) => userPermissions.includes(perm));
  }

  /**
   * Kiểm tra vai trò.
   */
  hasRoles(userRoles: string[], requiredRoles: string[]): boolean {
    if (hasSuperAdminRole(userRoles, this.superAdminRoles)) {
      return true;
    }
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  // ------------------------------------------------------------------------------------
  // Quản trị RBAC (admin API + bootstrap). Mọi thao đổi role/permission đều vô hiệu
  // cache quyền của user liên quan; claims trong access token cũ sẽ đúng lại sau refresh
  // (JWT ngắn hạn 15m) — mặc định an toàn, không cần thu hồi cưỡng chế.
  // ------------------------------------------------------------------------------------

  async createRole(name: string, description?: string) {
    const roleName = (name ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,60}$/.test(roleName)) {
      throw new BadRequestException('Tên role không hợp lệ: 2-60 ký tự [A-Z0-9_-], không phân biệt hoa thường (tự chuẩn hóa UPPER).');
    }
    const role = await this.rbacRepo.findOrCreateRole(roleName, false, description?.trim() || `Role ${roleName}`);
    return { id: role.id, name: role.name, description: role.description, isSystem: role.isSystem };
  }

  async listRoles() {
    const roles = await this.rbacRepo.listRoles();
    return roles.map((r) => ({ id: r.id, name: r.name, description: r.description, isSystem: r.isSystem }));
  }

  async grantPermissionsToRole(roleId: string, codes: string[]) {
    if (!Array.isArray(codes) || codes.length === 0) {
      throw new BadRequestException('Danh sách permission codes rỗng.');
    }
    const roles = await this.rbacRepo.listRoles();
    const role = roles.find((r) => r.id === roleId);
    if (!role) {
      throw new NotFoundException('Không tìm thấy role trong hệ thống.');
    }

    const granted: string[] = [];
    for (const raw of codes) {
      const code = (raw ?? '').trim();
      if (!/^[a-z0-9:_-]{3,100}$/.test(code)) {
        throw new BadRequestException(`Permission code không hợp lệ: [${code}] — định dạng <resource>:<action>[:<sub>] chữ thường.`);
      }
      const permission = await this.rbacRepo.findOrCreatePermission(code);
      await this.rbacRepo.linkRolePermission(roleId, permission.id);
      granted.push(code);
    }
    return { roleId, granted };
  }

  async assignRoleToUserByName(userId: string, roleName: string): Promise<UserAccessControl> {
    const role = await this.rbacRepo.findRoleByName((roleName ?? '').trim().toUpperCase());
    if (!role) {
      throw new NotFoundException(`Không tìm thấy role [${roleName}]. Tạo role trước khi gán.`);
    }
    await this.rbacRepo.assignRoleToUser(userId, role.id);
    await this.invalidateCache(userId);
    return this.getUserAccess(userId);
  }

  async revokeRoleFromUserByName(userId: string, roleName: string, actorUserId: string): Promise<UserAccessControl> {
    const normalized = (roleName ?? '').trim().toUpperCase();
    const role = await this.rbacRepo.findRoleByName(normalized);
    if (!role) {
      throw new NotFoundException(`Không tìm thấy role [${roleName}].`);
    }

    // Bảo vệ chống khóa hệ thống (lockout): ap dung cho MOI role trong danh sách
    // SUPER_ADMIN_ROLES cau hinh — khong hard-code ten: khong tu ha quyen chinh minh,
    // khong go super role khoi tai khoan cuoi cùng.
    if (this.superAdminRoles.includes(normalized)) {
      if (userId === actorUserId) {
        throw new BadRequestException('Không thể tự gỡ super role khỏi chính tài khoản đang đăng nhập.');
      }
      const holders = await this.rbacRepo.countUsersWithRole(role.id);
      if (holders <= 1) {
        throw new BadRequestException('Không thể gỡ super role khỏi tài khoản cuối cùng — cần ít nhất một quản trị viên.');
      }
    }

    const removed = await this.rbacRepo.removeRoleFromUser(userId, role.id);
    if (!removed) {
      throw new NotFoundException('User hiện không giữ role này.');
    }
    await this.invalidateCache(userId);
    return this.getUserAccess(userId);
  }

  async listRolePermissions(roleId: string): Promise<string[]> {
    const role = await this.rbacRepo.findRoleById(roleId);
    if (!role) {
      throw new NotFoundException('Không tìm thấy role trong hệ thống.');
    }
    const permissions = await this.rbacRepo.findPermissionsByRoleId(roleId);
    return permissions.map((p) => p.code);
  }

  async revokePermissionFromRole(roleId: string, code: string) {
    const role = await this.rbacRepo.findRoleById(roleId);
    if (!role) {
      throw new NotFoundException('Không tìm thấy role trong hệ thống.');
    }
    const permission = await this.rbacRepo.findPermissionByCode((code ?? '').trim());
    if (!permission) {
      throw new NotFoundException('Permission code không tồn tại trong catalog.');
    }
    const unlinked = await this.rbacRepo.unlinkRolePermission(roleId, permission.id);
    if (!unlinked) {
      throw new NotFoundException('Role hiện không giữ permission này.');
    }
    // Quyen thu hoi theo user cu se het hieu sau TTL cache + token cycle (xem API_GUIDE §23.3).
    return { roleId, revoked: permission.code };
  }

  async deleteRole(roleId: string) {
    const role = await this.rbacRepo.findRoleById(roleId);
    if (!role) {
      throw new NotFoundException('Không tìm thấy role trong hệ thống.');
    }
    if (role.isSystem) {
      throw new BadRequestException(`Role hệ thống [${role.name}] không thể xóa — dùng revoke role cho user để thu hồi.`);
    }
    if (this.superAdminRoles.includes(role.name.toUpperCase())) {
      throw new BadRequestException('Super role đang được tham chiếu cấu hình SUPER_ADMIN_ROLES — không thể xóa.');
    }
    await this.rbacRepo.deleteRole(roleId);
    return { deleted: role.name };
  }
}
