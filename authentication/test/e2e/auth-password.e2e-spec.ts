import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { createE2EApp, resetDb, DB_AVAILABLE, countRows, type E2EContext } from './e2e-harness.js';

const describeDb = DB_AVAILABLE ? describe : describe.skip;

describeDb('E2E (DB thật) - Password: Signup & Signin & Phiên', () => {
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

  const email = 'alice@example.com';
  const password = 'StrongPassword123@';

  async function signupAndTakeTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await ctx
      .http()
      .post('/api/v1/auth/signup')
      .send({ email, password, userName: 'Alice' })
      .expect(201);
    return {
      accessToken: res.body.data.accessToken,
      refreshToken: res.body.data.refreshToken,
    };
  }

  it('signup -> 201, tạo đủ dòng users/identities/password_credentials/user_emails + roles/permissions', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/auth/signup')
      .send({ email, password, userName: 'Alice' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.body.data.refreshToken).toBeTypeOf('string');
    expect(res.body.data.user.roles).toEqual(['USER']);
    expect(res.body.data.user.permissions).toContain('user:profile:read');

    expect(await countRows(ctx.db, 'users')).toBe(1);
    expect(await countRows(ctx.db, 'password_credentials')).toBe(1);
    expect(await countRows(ctx.db, 'user_emails')).toBe(1);
    expect(await countRows(ctx.db, 'identities')).toBe(1);
  });

  it('signup trùng email -> 409 AUTH_EMAIL_ALREADY_EXISTS', async () => {
    await signupAndTakeTokens();
    const res = await ctx
      .http()
      .post('/api/v1/auth/signup')
      .send({ email, password })
      .expect(409);
    expect(res.body.error.code).toBe('AUTH_EMAIL_ALREADY_EXISTS');
  });

  it('signup dữ liệu sai định dạng -> 400 VALIDATION_ERROR', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/auth/signup')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('signin đúng -> 200 + token; sai mật khẩu -> 401 AUTH_INVALID_CREDENTIALS', async () => {
    await signupAndTakeTokens();

    const ok = await ctx
      .http()
      .post('/api/v1/auth/signin')
      .send({ email, password })
      .expect(200);
    expect(ok.body.data.accessToken).toBeTypeOf('string');

    const bad = await ctx
      .http()
      .post('/api/v1/auth/signin')
      .send({ email, password: 'WrongPassword@' })
      .expect(401);
    expect(bad.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('signin sai 5 lần liên tiếp -> khóa tài khoản AUTH_ACCOUNT_LOCKED', async () => {
    await signupAndTakeTokens();

    let lastCode = '';
    for (let i = 0; i < 5; i += 1) {
      const res = await ctx.http().post('/api/v1/auth/signin').send({ email, password: 'BadPass@1' });
      lastCode = res.body.error.code;
    }
    expect(lastCode).toBe('AUTH_ACCOUNT_LOCKED');

    // Ngay cả mật khẩu đúng cũng bị chặn khi đang khóa
    const blocked = await ctx
      .http()
      .post('/api/v1/auth/signin')
      .send({ email, password })
      .expect(401);
    expect(blocked.body.error.code).toBe('AUTH_ACCOUNT_LOCKED');
  });

  it('me: có Bearer -> 200; không Bearer -> 401; user thường gọi admin -> 403 FORBIDDEN_ROLE', async () => {
    const { accessToken } = await signupAndTakeTokens();

    const me = await ctx
      .http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(me.body.data.emails[0].email).toBe(email);
    expect(me.body.data.roles).toContain('USER');

    await ctx.http().get('/api/v1/auth/me').expect(401);

    const admin = await ctx
      .http()
      .get('/api/v1/auth/admin/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
    expect(admin.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('refresh rotation: dùng token mới OK; dùng lại token cũ -> AUTH_TOKEN_REUSED', async () => {
    const { refreshToken } = await signupAndTakeTokens();

    const first = await ctx.http().post('/api/v1/auth/refresh').send({ refreshToken }).expect(200);
    expect(first.body.data.refreshToken).not.toBe(refreshToken);

    const reuse = await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
    expect(reuse.body.error.code).toBe('AUTH_TOKEN_REUSED');
  });

  it('signout -> thu hồi phiên; refresh lại sau logout -> 401', async () => {
    const { accessToken, refreshToken } = await signupAndTakeTokens();

    await ctx
      .http()
      .post('/api/v1/auth/signout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await ctx.http().post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('change-password: đúng -> 200; trùng mật khẩu cũ -> 400; sai mật khẩu cũ -> 401', async () => {
    const { accessToken } = await signupAndTakeTokens();

    const same = await ctx
      .http()
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: password, newPassword: password })
      .expect(400);
    expect(same.body.error.code).toBe('AUTH_PASSWORD_SAME_AS_CURRENT');

    const wrong = await ctx
      .http()
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'Nope@1234', newPassword: 'AnotherPass123@' })
      .expect(401);
    expect(wrong.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');

    await ctx
      .http()
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: password, newPassword: 'NewStrongPass456@' })
      .expect(200);

    // Đăng nhập bằng mật khẩu mới phải thành công
    await ctx
      .http()
      .post('/api/v1/auth/signin')
      .send({ email, password: 'NewStrongPass456@' })
      .expect(200);
  });

  it('sessions: liệt kê phiên và thu hồi một phiên cụ thể', async () => {
    const { accessToken } = await signupAndTakeTokens();

    const list = await ctx
      .http()
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.length).toBeGreaterThanOrEqual(1);

    const sessionId = list.body.data[0].id;
    await ctx
      .http()
      .delete(`/api/v1/auth/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
