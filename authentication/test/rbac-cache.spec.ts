import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RbacService } from '../src/modules/rbac/rbac.service.js';
import { InMemoryKeyValueStore } from '../src/modules/redis/in-memory-keyvalue.store.js';

describe('Kiểm thử Cache Quyền RBAC (TTL In-memory Cache)', () => {
  let rbacRepo: {
    findRolesByUserId: ReturnType<typeof vi.fn>;
    findPermissionsByRoleIds: ReturnType<typeof vi.fn>;
    findOrCreateRole: ReturnType<typeof vi.fn>;
    assignRoleToUser: ReturnType<typeof vi.fn>;
  };
  let configService: { get: ReturnType<typeof vi.fn> };
  let service: RbacService;

  beforeEach(() => {
    rbacRepo = {
      findRolesByUserId: vi.fn().mockResolvedValue([{ id: 'role-1', name: 'EDITOR' }]),
      findPermissionsByRoleIds: vi.fn().mockResolvedValue([{ id: 'p1', code: 'post:write' }]),
      findOrCreateRole: vi.fn().mockResolvedValue({ id: 'role-user', name: 'USER' }),
      assignRoleToUser: vi.fn().mockResolvedValue(undefined),
    };
    configService = {
      get: vi.fn((key: string, def?: unknown) => (key === 'auth.rbacCacheTtlMs' ? 60000 : def)),
    };
    service = new RbacService(
      rbacRepo as never,
      new InMemoryKeyValueStore() as never,
      configService as never,
    );
  });

  it('Gọi getUserAccess 2 lần liên tiếp -> repository chỉ truy vấn DB đúng 1 lần (cache hit)', async () => {
    const first = await service.getUserAccess('user-1');
    const second = await service.getUserAccess('user-1');

    expect(rbacRepo.findRolesByUserId).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(second.roles).toEqual(['EDITOR']);
    expect(second.permissions).toContain('post:write');
  });

  it('assignDefaultAccess -> vô hiệu cache, lần truy vấn sau đọc lại từ DB', async () => {
    await service.getUserAccess('user-2');
    expect(rbacRepo.findRolesByUserId).toHaveBeenCalledTimes(1);

    await service.assignDefaultAccess('user-2');

    await service.getUserAccess('user-2');
    expect(rbacRepo.findRolesByUserId).toHaveBeenCalledTimes(2);
  });

  it('User chưa có role trong DB -> nhận role/permission mặc định', async () => {
    rbacRepo.findRolesByUserId.mockResolvedValueOnce([]);
    const access = await service.getUserAccess('user-new');
    expect(access.roles).toEqual(['USER']);
    expect(access.permissions.length).toBeGreaterThan(0);
  });
});
