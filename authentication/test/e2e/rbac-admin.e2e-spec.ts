import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import {
  createE2EApp,
  resetDb,
  DB_AVAILABLE,
  queryOne,
  type E2EContext,
} from './e2e-harness.js';

const describeDb = DB_AVAILABLE ? describe : describe.skip;

/**
 * E2E Quản trị RBAC (RbacAdminController) + kiểm chứng global default-deny guard.
 * Toàn bộ HTTP + DB là THẬT; chỉ SUPER_ADMIN được "phong" bằng SQL trực tiếp vì
 * bootstrap ADMIN_BOOTSTRAP_EMAILS chạy lúc boot (trước khi user tồn tại trong test).
 */
describeDb('E2E (DB thật) - Quản trị RBAC & Default-deny guard', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetDb(ctx.db);
  });

  async function signup(email: string): Promise<{ accessToken: string; userId: string }> {
    const res = await ctx
      .http()
      .post('/api/v1/auth/signup')
      .send({ email, password: 'StrongPassword123@' })
      .expect(201);
    return { accessToken: res.body.data.accessToken, userId: res.body.data.user.id };
  }

  /** Phong SUPER_ADMIN (tạo role + membership active + gán) bằng SQL — đường test-only. */
  async function makeSuperAdmin(userId: string): Promise<void> {
    let role = await queryOne<{ id: string }>(ctx.db, `SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;`);
    if (!role) {
      role = await queryOne<{ id: string }>(
        ctx.db,
        `INSERT INTO roles (id, org_id, name, description, is_system, created_at, updated_at)
         VALUES (gen_random_uuid(), NULL, 'SUPER_ADMIN', 'seed-test', true, now(), now()) RETURNING id;`,
      );
    }
    await ctx.db.query(
      `INSERT INTO memberships (id, org_id, user_id, status, joined_at, created_at, updated_at)
       SELECT gen_random_uuid(), gen_random_uuid(), $1, 'active', now(), now(), now()
       WHERE NOT EXISTS (SELECT 1 FROM memberships WHERE user_id = $1);`,
      [userId],
    );
    const membership = await queryOne<{ id: string }>(ctx.db, `SELECT id FROM memberships WHERE user_id = $1;`, [userId]);
    await ctx.db.query(
      `INSERT INTO membership_roles (membership_id, role_id, assigned_at)
       VALUES ($1, $2, now()) ON CONFLICT DO NOTHING;`,
      [membership!.id, role!.id],
    );
  }

  async function reSignin(email: string): Promise<string> {
    const res = await ctx
      .http()
      .post('/api/v1/auth/signin')
      .send({ email, password: 'StrongPassword123@' })
      .expect(200);
    return res.body.data.accessToken as string;
  }

  it('default-deny: GET /admin/rbac/roles không token -> 401; user USER thường -> 403 FORBIDDEN_ROLE', async () => {
    const { accessToken } = await signup('member@example.com');

    const anon = await ctx.http().get('/api/v1/admin/rbac/roles').expect(401);
    expect(anon.body.error.code).toBe('AUTH_TOKEN_INVALID');

    const forbidden = await ctx
      .http()
      .get('/api/v1/admin/rbac/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('trọn vòng: tạo role -> gán permission -> phong cho user -> effective -> thu hồi', async () => {
    const { userId: adminId } = await signup('admin@example.com');
    await makeSuperAdmin(adminId);
    const adminToken = await reSignin('admin@example.com');

    // 1) Tạo role tùy chỉnh (tên thường -> chuẩn hóa UPPER)
    const created = await ctx
      .http()
      .post('/api/v1/admin/rbac/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'support_agent', description: 'Hỗ trợ' })
      .expect(201);
    expect(created.body.data.name).toBe('SUPPORT_AGENT');
    const roleId = created.body.data.id as string;

    // 2) Gán permission cho role (permission row được tự tạo)
    const grant = await ctx
      .http()
      .post(`/api/v1/admin/rbac/roles/${roleId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codes: ['audit:log:read', 'user:manage'] })
      .expect(200);
    expect(grant.body.data.granted).toEqual(['audit:log:read', 'user:manage']);

    // 3) Phong role cho user2 -> effective access chứa role + permission mới
    const { userId: user2Id, accessToken: user2OldToken } = await signup('agent@example.com');
    const assign = await ctx
      .http()
      .post(`/api/v1/admin/rbac/users/${user2Id}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleName: 'SUPPORT_AGENT' })
      .expect(200);
    expect(assign.body.data.roles).toContain('SUPPORT_AGENT');
    expect(assign.body.data.permissions).toContain('audit:log:read');

    // 3b) Token cũ của user2 (cấp TRƯỚC khi phong) chưa có quyền admin -> vẫn 403.
    //     Chứng minh claim nằm trong JWT, đúng lại sau refresh/signin — không phải bug.
    await ctx
      .http()
      .get('/api/v1/admin/rbac/roles')
      .set('Authorization', `Bearer ${user2OldToken}`)
      .expect(403);

    // 4) GET access của user2 qua admin endpoint
    const access = await ctx
      .http()
      .get(`/api/v1/admin/rbac/users/${user2Id}/access`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(access.body.data.roles).toEqual(expect.arrayContaining(['USER', 'SUPPORT_AGENT']));

    // 5) Thu hồi role -> chỉ còn USER + permission mặc định
    const revoke = await ctx
      .http()
      .delete(`/api/v1/admin/rbac/users/${user2Id}/roles/SUPPORT_AGENT`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(revoke.body.data.roles).not.toContain('SUPPORT_AGENT');
    expect(revoke.body.data.permissions).not.toContain('audit:log:read');
  });

  it('gán role chưa tồn tại -> 404 (không âm thầm tạo qua đường gán user)', async () => {
    const { userId: adminId } = await signup('admin2@example.com');
    await makeSuperAdmin(adminId);
    const adminToken = await reSignin('admin2@example.com');

    const { userId } = await signup('someone@example.com');
    await ctx
      .http()
      .post(`/api/v1/admin/rbac/users/${userId}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleName: 'GHOST_ROLE' })
      .expect(404);
  });

  it('chống lockout: không tự gỡ SUPER_ADMIN khỏi chính tài khoản đang dùng', async () => {
    const { userId: adminId } = await signup('solo-admin@example.com');
    await makeSuperAdmin(adminId);
    const adminToken = await reSignin('solo-admin@example.com');

    const res = await ctx
      .http()
      .delete(`/api/v1/admin/rbac/users/${adminId}/roles/SUPER_ADMIN`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
    expect(res.body.error.message).toMatch(/chính tài khoản đang đăng nhập/);
  });

  it('vòng đời ĐỘNG của role: list permissions -> thu hồi 1 code -> xóa role; isSystem được bảo vệ', async () => {
    const { userId: adminId } = await signup('lifecycle-admin@example.com');
    await makeSuperAdmin(adminId);
    const adminToken = await reSignin('lifecycle-admin@example.com');

    const created = await ctx
      .http()
      .post('/api/v1/admin/rbac/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'TEMP_AUDITOR' })
      .expect(201);
    const roleId = created.body.data.id as string;

    await ctx
      .http()
      .post(`/api/v1/admin/rbac/roles/${roleId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codes: ['audit:log:read', 'user:manage'] })
      .expect(200);

    // 1) Liệt kê permission của role — động, đọc từ DB
    const list = await ctx
      .http()
      .get(`/api/v1/admin/rbac/roles/${roleId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body.data.permissions).toEqual(['audit:log:read', 'user:manage']);

    // 2) Thu hồi đúng MỘT code
    const revoked = await ctx
      .http()
      .delete(`/api/v1/admin/rbac/roles/${roleId}/permissions/audit:log:read`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(revoked.body.data.revoked).toBe('audit:log:read');

    const listAfter = await ctx
      .http()
      .get(`/api/v1/admin/rbac/roles/${roleId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(listAfter.body.data.permissions).toEqual(['user:manage']);

    // 3) Xóa role động — role không còn trong danh sách
    await ctx
      .http()
      .delete(`/api/v1/admin/rbac/roles/${roleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const roles = await ctx
      .http()
      .get('/api/v1/admin/rbac/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(roles.body.data.map((r: { name: string }) => r.name)).not.toContain('TEMP_AUDITOR');

    // 4)role isSystem được bảo vệ khỏi xóa
    const sysRoles = roles.body.data.find((r: { name: string }) => r.name === 'USER');
    const protectedDel = await ctx
      .http()
      .delete(`/api/v1/admin/rbac/roles/${sysRoles.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
    expect(protectedDel.body.error.message).toMatch(/không thể xóa/i);
  });
});
