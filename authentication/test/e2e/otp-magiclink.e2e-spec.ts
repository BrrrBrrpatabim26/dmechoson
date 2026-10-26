import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import {
  createE2EApp,
  resetDb,
  DB_AVAILABLE,
  countRows,
  queryOne,
  mailCapture,
  type E2EContext,
} from './e2e-harness.js';

const describeDb = DB_AVAILABLE ? describe : describe.skip;

describeDb('E2E (DB thật) - Email OTP, Phone OTP & Magic Link', () => {
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

  // ---------- Email OTP ----------
  it('email OTP: send -> verify (user mới) -> 201? không, 200 + token, tự tạo user đã verify', async () => {
    const target = 'otp.new@example.com';

    const send = await ctx
      .http()
      .post('/api/v1/auth/otp/send')
      .send({ target, channel: 'email', purpose: 'login' })
      .expect(200);
    expect(send.body.success).toBe(true);

    const otp = mailCapture.lastOtp();
    expect(otp).toMatch(/^\d{6}$/);

    const verify = await ctx
      .http()
      .post('/api/v1/auth/otp/verify')
      .send({ target, otp, purpose: 'login', displayName: 'OTP User' })
      .expect(200);
    expect(verify.body.data.accessToken).toBeTypeOf('string');

    // User + email (đã verify) + identity email_otp được tạo thật trong DB
    expect(await countRows(ctx.db, 'users')).toBe(1);
    const emailRow = await queryOne<{ verified_at: Date | null }>(
      ctx.db,
      'SELECT verified_at FROM user_emails WHERE email = $1;',
      [target],
    );
    expect(emailRow?.verified_at).not.toBeNull();
  });

  it('email OTP: verify SAI -> 401 AUTH_OTP_INVALID', async () => {
    const target = 'otp.bad@example.com';
    await ctx
      .http()
      .post('/api/v1/auth/otp/send')
      .send({ target, channel: 'email', purpose: 'login' })
      .expect(200);

    const real = mailCapture.lastOtp();
    const wrong = real === '000000' ? '111111' : '000000';

    const res = await ctx
      .http()
      .post('/api/v1/auth/otp/verify')
      .send({ target, otp: wrong, purpose: 'login' })
      .expect(401);
    expect(res.body.error.code).toBe('AUTH_OTP_INVALID');
  });

  it('email OTP: nhập sai 5 lần -> 429 AUTH_OTP_MAX_ATTEMPTS_EXCEEDED', async () => {
    const target = 'otp.lock@example.com';
    await ctx
      .http()
      .post('/api/v1/auth/otp/send')
      .send({ target, channel: 'email', purpose: 'login' })
      .expect(200);

    const real = mailCapture.lastOtp();
    const wrong = real === '000000' ? '111111' : '000000';

    let lastCode = '';
    for (let i = 0; i < 5; i += 1) {
      const res = await ctx
        .http()
        .post('/api/v1/auth/otp/verify')
        .send({ target, otp: wrong, purpose: 'login' });
      lastCode = res.body?.error?.code ?? '';
    }
    expect(lastCode).toBe('AUTH_OTP_MAX_ATTEMPTS_EXCEEDED');
  });

  it('email OTP: login user đã tồn tại (tạo bằng password) -> giữ nguyên cùng userId', async () => {
    const email = 'existing.otp@example.com';
    const signup = await ctx
      .http()
      .post('/api/v1/auth/signup')
      .send({ email, password: 'StrongPassword123@' })
      .expect(201);
    const originalUserId = signup.body.data.user.id;

    await ctx
      .http()
      .post('/api/v1/auth/otp/send')
      .send({ target: email, channel: 'email', purpose: 'login' })
      .expect(200);
    const otp = mailCapture.lastOtp();

    const verify = await ctx
      .http()
      .post('/api/v1/auth/otp/verify')
      .send({ target: email, otp, purpose: 'login' })
      .expect(200);

    expect(verify.body.data.user.id).toBe(originalUserId);
    // Không tạo user thứ 2
    expect(await countRows(ctx.db, 'users')).toBe(1);
  });

  // ---------- Phone OTP ----------
  it('phone OTP: send (sms) -> 200 + ghi verification_tokens (channel=sms)', async () => {
    const phone = '+84912345678';
    const send = await ctx
      .http()
      .post('/api/v1/auth/otp/send')
      .send({ target: phone, channel: 'sms', purpose: 'login' })
      .expect(200);
    expect(send.body.success).toBe(true);

    const row = await queryOne<{ channel: string; target: string }>(
      ctx.db,
      'SELECT channel, target FROM verification_tokens WHERE target = $1 AND purpose = $2;',
      [phone.toLowerCase(), 'login'],
    );
    expect(row?.channel).toBe('sms');
  });

  it('phone OTP: verify sai -> 401 (không tạo user)', async () => {
    const phone = '+84911122233';
    await ctx
      .http()
      .post('/api/v1/auth/otp/send')
      .send({ target: phone, channel: 'sms', purpose: 'login' })
      .expect(200);

    await ctx
      .http()
      .post('/api/v1/auth/otp/verify')
      .send({ target: phone, otp: '999999', purpose: 'login' });

    expect(await countRows(ctx.db, 'users')).toBe(0);
  });

  // ---------- Magic Link ----------
  it('magic link: send -> verify token -> 200 + token; dùng lại -> 401', async () => {
    const email = 'magic@example.com';
    await ctx
      .http()
      .post('/api/v1/auth/magic-link/send')
      .send({ email, redirectUrl: 'http://localhost:3000/auth/callback' })
      .expect(200);

    const token = mailCapture.lastToken();
    expect(token).toMatch(/[A-Za-z0-9_-]{20,}/);

    const first = await ctx
      .http()
      .post('/api/v1/auth/magic-link/verify')
      .send({ token, deviceName: 'E2E Browser' })
      .expect(200);
    expect(first.body.data.accessToken).toBeTypeOf('string');
    expect(await countRows(ctx.db, 'users')).toBe(1);

    // Replay: token đã consume
    const replay = await ctx
      .http()
      .post('/api/v1/auth/magic-link/verify')
      .send({ token })
      .expect(401);
    expect(replay.body.error.code).toBe('AUTH_OTP_EXPIRED');
  });

  it('magic link: token không tồn tại -> 401 AUTH_OTP_EXPIRED', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/auth/magic-link/verify')
      .send({ token: 'a'.repeat(43) })
      .expect(401);
    expect(res.body.error.code).toBe('AUTH_OTP_EXPIRED');
  });
});
