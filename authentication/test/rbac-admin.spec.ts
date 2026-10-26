import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../src/modules/rbac/rbac.service.js';
import { InMemoryKeyValueStore } from '../src/modules/redis/in-memory-keyvalue.store.js';
import { RolesGuard } from '../src/common/guards/roles.guard.js';
import { resolveSuperAdminRoles } from '../src/common/utils/super-roles.util.js';

/**
 * Unit test các method quản trị RBAC mới (createRole / grantPermissionsToRole /
 * assignRoleToUserByName / revokeRoleFromUserByName) với repository mock.
 */
describe('Quản trị RBAC (RbacService admin methods)', () => {
  let rbacRepo: Record<string, ReturnType<typeof vi.fn>>;
  let configService: { get: ReturnType<typeof vi.fn> };
  let service: RbacService;

  const superAdminRole = { id: 'role-super', name: 'SUPER_ADMIN' };

  beforeEach(() => {
    rbacRepo = {
      findRolesByUserId: vi.fn().mockResolvedValue([{ id: 'role-user', name: 'USER' }]),
      findPermissionsByRoleIds: vi.fn().mockResolvedValue([]),
      findOrCreateRole: vi.fn(async (name: string) => ({ id: `role-${name}`, name, description: `Role ${name}`, isSystem: false })),
      findOrCreatePermission: vi.fn(async (code: string) => ({ id: `perm-${code}`, code })),
      assignRoleToUser: vi.fn().mockResolvedValue(undefined),
      findRoleByName: vi.fn(async (name: string) =>
        name === 'SUPER_ADMIN' ? superAdminRole : name === 'USER' ? { id: 'role-user', name } : null,
      ),
      listRoles: vi.fn().mockResolvedValue([{ id: 'role-1', name: 'USER', description: null, isSystem: true }]),
      findPermissionsByRoleId: vi.fn().mockResolvedValue([{ id: 'perm-audit:log:read', code: 'audit:log:read' }]),
      findRoleById: vi.fn(async (id: string) =>
        id === 'role-sys' ? { id, name: 'USER', isSystem: true } : id === 'role-1' || id === 'role-x' ? { id, name: 'DYNAMIC', isSystem: false } : null,
      ),
      findPermissionByCode: vi.fn(async (code: string) => ({ id: `perm-${code}`, code })),
      unlinkRolePermission: vi.fn().mockResolvedValue(true),
      deleteRole: vi.fn().mockResolvedValue(true),
      linkRolePermission: vi.fn().mockResolvedValue(undefined),
      removeRoleFromUser: vi.fn().mockResolvedValue(true),
      countUsersWithRole: vi.fn().mockResolvedValue(3),
    };
    configService = { get: vi.fn((key: string, def?: unknown) => (key === 'auth.rbacCacheTtlMs' ? 0 : def)) };
    service = new RbacService(rbacRepo as never, new InMemoryKeyValueStore() as never, configService as never);
  });

  describe('createRole', () => {
    it('chuẩn hóa tên về UPPER và idempotent qua findOrCreateRole', async () => {
      const role = await service.createRole('support_agent', 'Hỗ trợ khách hàng');
      expect(role.name).toBe('SUPPORT_AGENT');
      expect(rbacRepo.findOrCreateRole).toHaveBeenCalledWith('SUPPORT_AGENT', false, 'Hỗ trợ khách hàng');
    });

    it('từ chối tên chứa ký tự ngoài [A-Z0-9_-]', async () => {
      await expect(service.createRole('xếp hạng!')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('grantPermissionsToRole', () => {
    it('role không tồn tại -> NotFoundException', async () => {
      await expect(service.grantPermissionsToRole('role-khong-co', ['a:b'])).rejects.toBeInstanceOf(NotFoundException);
    });

    it('code không hợp lệ -> BadRequest; code hợp lệ -> findOrCreate + link idempotent', async () => {
      await expect(service.grantPermissionsToRole('role-1', ['MAU PHAI'])).rejects.toBeInstanceOf(BadRequestException);

      const result = await service.grantPermissionsToRole('role-1', ['audit:log:read', 'user:manage']);
      expect(result.granted).toEqual(['audit:log:read', 'user:manage']);
      expect(rbacRepo.linkRolePermission).toHaveBeenCalledTimes(2);
      expect(rbacRepo.linkRolePermission).toHaveBeenCalledWith('role-1', 'perm-audit:log:read');
    });

    it('danh sách rỗng -> BadRequest', async () => {
      await expect(service.grantPermissionsToRole('role-1', [])).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('assignRoleToUserByName', () => {
    it('role chưa tạo -> NotFound (không âm thầm tạo role khi gán)', async () => {
      await expect(service.assignRoleToUserByName('u1', 'KHONG_TON_TAI')).rejects.toBeInstanceOf(NotFoundException);
      expect(rbacRepo.assignRoleToUser).not.toHaveBeenCalled();
    });

    it('gán role tồn tại -> assign + trả access mới nhất', async () => {
      const access = await service.assignRoleToUserByName('u1', 'user');
      expect(rbacRepo.assignRoleToUser).toHaveBeenCalledWith('u1', 'role-user');
      expect(access.roles).toContain('USER');
    });
  });

  describe('revokeRoleFromUserByName — chống lockout', () => {
    it('không tự gỡ SUPER_ADMIN khỏi chính mình', async () => {
      await expect(
        service.revokeRoleFromUserByName('u1', 'SUPER_ADMIN', 'u1'),
      ).rejects.toThrow(/chính tài khoản đang đăng nhập/);
    });

    it('không gỡ SUPER_ADMIN khỏi tài khoản cuối cùng', async () => {
      rbacRepo.countUsersWithRole.mockResolvedValueOnce(1);
      await expect(
        service.revokeRoleFromUserByName('u2', 'SUPER_ADMIN', 'u1'),
      ).rejects.toThrow(/tài khoản cuối cùng/);
    });

    it('gỡ role thường thành công -> removeRoleFromUser + trả access sau gỡ', async () => {
      const access = await service.revokeRoleFromUserByName('u2', 'USER', 'u1');
      expect(rbacRepo.removeRoleFromUser).toHaveBeenCalledWith('u2', 'role-user');
      expect(access.roles).toContain('USER'); // mock repo vẫn trả role-user sau gỡ — unit test chỉ verify wiring
    });

    it('user không giữ role -> NotFound', async () => {
      rbacRepo.removeRoleFromUser.mockResolvedValueOnce(false);
      await expect(service.revokeRoleFromUserByName('u2', 'USER', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('Vòng đời role ĐỘNG (delete / revoke permission / list permissions)', () => {
    it('từ chối xóa role isSystem -> BadRequest', async () => {
      await expect(service.deleteRole('role-sys')).rejects.toBeInstanceOf(BadRequestException);
      expect(rbacRepo.deleteRole).not.toHaveBeenCalled();
    });

    it('xóa role động thành công qua repository (transaction inside)', async () => {
      const result = await service.deleteRole('role-x');
      expect(result.deleted).toBe('DYNAMIC');
      expect(rbacRepo.deleteRole).toHaveBeenCalledWith('role-x');
    });

    it('thu hồi permission khỏi role: code không tồn tại -> NotFound; hợp lệ -> unlink', async () => {
      rbacRepo.findPermissionByCode.mockResolvedValueOnce(null);
      await expect(service.revokePermissionFromRole('role-1', 'khong:co')).rejects.toBeInstanceOf(NotFoundException);

      const result = await service.revokePermissionFromRole('role-1', 'audit:log:read');
      expect(result.revoked).toBe('audit:log:read');
      expect(rbacRepo.unlinkRolePermission).toHaveBeenCalledWith('role-1', 'perm-audit:log:read');
    });

    it('liệt kê permission của role trả đúng codes', async () => {
      const codes = await service.listRolePermissions('role-1');
      expect(codes).toEqual(['audit:log:read']);
    });
  });

  describe('Super role KHÔNG hard-code — phân giải từ cấu hình', () => {
    it('resolveSuperAdminRoles: csv thường hóa UPPER, mặc định SUPER_ADMIN khi rỗng', () => {
      expect(resolveSuperAdminRoles('chief_officer, root ')).toEqual(['CHIEF_OFFICER', 'ROOT']);
      expect(resolveSuperAdminRoles('')).toEqual(['SUPER_ADMIN']);
      expect(resolveSuperAdminRoles(['custom_admin'])).toEqual(['CUSTOM_ADMIN']);
    });

    it('RolesGuard cho qua khi user giữ super role TÙY CONFIG (khác tên SUPER_ADMIN)', () => {
      const reflector = new Reflector();
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN'] as never);
      const configMock = { get: vi.fn((key: string) => (key === 'auth.superAdminRoles' ? ['CHIEF_OFFICER'] : undefined)) };
      const guard = new RolesGuard(reflector, configMock as never);

      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user: { roles: ['CHIEF_OFFICER'], permissions: [] } }) }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as never;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('RolesGuard vẫn chặn role thường khi super role đã đổi tên theo config', () => {
      const reflector = new Reflector();
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN'] as never);
      const configMock = { get: vi.fn((key: string) => (key === 'auth.superAdminRoles' ? ['CHIEF_OFFICER'] : undefined)) };
      const guard = new RolesGuard(reflector, configMock as never);

      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user: { roles: ['SUPER_ADMIN'], permissions: [] } }) }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as never;

      // SUPER_ADMIN khong con la super role theo config nua -> bi doi chieu nhu role binh thuong -> choi
      expect(() => guard.canActivate(ctx)).toThrow();
    });
  });
});
