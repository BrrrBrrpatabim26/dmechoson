import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { generate } from 'otplib';
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

describeDb('E2E (DB thật) - Email Verification & MFA/TOTP', () => {
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

  async function signupTakeTokens(): Promise<{ accessToken: string; userId: string }> {
    const res = await ctx
      .http()
      .post('/api/v1/auth/signup')
      .send({ email: 'verify@example.com', password: 'StrongPassword123@', userName: 'Verify' })
      .expect(201);
    return { accessToken: res.body.data.accessToken, userId: res.body.data.user.id };
  }

  // ---------- Email Verification ----------
  it('email-verification: send -> verify -> DB user_emails.verified_at được set', async () => {
    const { accessToken } = await signupTakeTokens();

    // Trước verify: chưa verified
    const before = await queryOne<{ verified_at: Date | null }>(
      ctx.db,
      'SELECT verified_at FROM user_emails WHERE email = $1;',
      ['verify@example.com'],
    );
    expect(before?.verified_at).toBeNull();

    await ctx
      .http()
      .post('/api/v1/auth/email-verification/send')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const token = mailCapture.lastToken();
    const verify = await ctx
      .http()
      .post('/api/v1/auth/email-verification/verify')
      .send({ token })
      .expect(200);
    expect(verify.body.data.email).toBe('verify@example.com');

    const after = await queryOne<{ verified_at: Date | null }>(
      ctx.db,
      'SELECT verified_at FROM user_emails WHERE email = $1;',
      ['verify@example.com'],
    );
    expect(after?.verified_at).not.toBeNull();
  });

  it('email-verification: dùng lại token -> 401 (chống replay)', async () => {
    const { accessToken } = await signupTakeTokens();
    await ctx
      .http()
      .post('/api/v1/auth/email-verification/send')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const token = mailCapture.lastToken();
    await ctx.http().post('/api/v1/auth/email-verification/verify').send({ token }).expect(200);

    const replay = await ctx
      .http()
      .post('/api/v1/auth/email-verification/verify')
      .send({ token })
      .expect(401);
    expect(replay.body.error.code).toBe('AUTH_OTP_EXPIRED');
  });

  it('email-verification/send yêu cầu Bearer -> 401 nếu thiếu', async () => {
    await ctx.http().post('/api/v1/auth/email-verification/send').expect(401);
  });

  // ---------- MFA / TOTP ----------
  async function enableTotp(accessToken: string): Promise<{ secret: string; recoveryCodes: string[] }> {
    const setup = await ctx
      .http()
      .post('/api/v1/auth/mfa/totp/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const otpauthUrl: string = setup.body.data.otpauthUrl;
    const secret = new URL(otpauthUrl).searchParams.get('secret');
    expect(secret).toBeTruthy();

    const code = await generate({ secret: secret! });
    const verify = await ctx
      .http()
      .post('/api/v1/auth/mfa/totp/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code })
      .expect(200);

    return { secret: secret!, recoveryCodes: verify.body.data.recoveryCodes as string[] };
  }

  it('mfa/totp: setup -> verify mã đúng -> bật factor + 8 recovery codes', async () => {
    const { accessToken } = await signupTakeTokens();
    const { recoveryCodes } = await enableTotp(accessToken);

    expect(recoveryCodes).toHaveLength(8);
    expect(await countRows(ctx.db, 'mfa_factors')).toBe(1);

    const factor = await queryOne<{ is_enabled: boolean; type: string }>(
      ctx.db,
      'SELECT is_enabled, type FROM mfa_factors LIMIT 1;',
    );
    expect(factor?.is_enabled).toBe(true);
    expect(factor?.type).toBe('totp');

    // Secret KHÔNG lưu dạng thô (đã AES-GCM vào cột bytea)
    const secretEnc = await queryOne<{ secret_enc: Buffer }>(
      ctx.db,
      'SELECT secret_enc FROM mfa_factors LIMIT 1;',
    );
    expect(Buffer.isBuffer(secretEnc?.secret_enc)).toBe(true);
  });

  it('mfa/totp: verify mã sai -> 400', async () => {
    const { accessToken } = await signupTakeTokens();
    const setup = await ctx
      .http()
      .post('/api/v1/auth/mfa/totp/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(setup.body.data.otpauthUrl).toContain('otpauth://totp/');

    const res = await ctx
      .http()
      .post('/api/v1/auth/mfa/totp/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: '000000' })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  it('mfa: list factors + V2 security-capabilities phản ánh mfaEnabled=true', async () => {
    const { accessToken } = await signupTakeTokens();
    await enableTotp(accessToken);

    const list = await ctx
      .http()
      .get('/api/v1/auth/mfa/factors')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(list.body.data.factors.some((f: { type: string }) => f.type === 'totp')).toBe(true);
    expect(list.body.data.remainingRecoveryCodes).toBe(8);

    const caps = await ctx
      .http()
      .get('/api/v2/auth/security-capabilities')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(caps.body.data.mfaEnabled).toBe(true);
  });

  it('mfa/recovery: dùng 1 mã hợp lệ -> 200; dùng lại -> 400', async () => {
    const { accessToken } = await signupTakeTokens();
    const { recoveryCodes } = await enableTotp(accessToken);
    const [first] = recoveryCodes;

    const ok = await ctx
      .http()
      .post('/api/v1/auth/mfa/recovery/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: first })
      .expect(200);
    expect(ok.body.data.remaining).toBe(7);

    await ctx
      .http()
      .post('/api/v1/auth/mfa/recovery/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: first })
      .expect(400);
  });

  it('mfa/factors/:id DELETE -> tắt factor', async () => {
    const { accessToken, userId } = await signupTakeTokens();
    await enableTotp(accessToken);

    const factor = await queryOne<{ id: string }>(
      ctx.db,
      'SELECT id FROM mfa_factors WHERE user_id = $1 LIMIT 1;',
      [userId],
    );
    await ctx
      .http()
      .delete(`/api/v1/auth/mfa/factors/${factor!.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const after = await queryOne<{ is_enabled: boolean }>(
      ctx.db,
      'SELECT is_enabled FROM mfa_factors WHERE id = $1;',
      [factor!.id],
    );
    expect(after?.is_enabled).toBe(false);
  });

  // ---------- S2: Enforce MFA trong luồng signin (password) ----------
  it('signin sau khi bat TOTP: thieu otp -> 401 MFA_REQUIRED; sai -> 401 MFA_INVALID; dung -> 200', async () => {
    const { accessToken } = await signupTakeTokens();
    const { secret } = await enableTotp(accessToken);

    const body = { email: 'verify@example.com', password: 'StrongPassword123@' };

    // 1) Khong kem ma -> choi phat hanh phiên
    const missing = await ctx.http().post('/api/v1/auth/signin').send(body).expect(401);
    expect(missing.body.error.code).toBe('AUTH_MFA_REQUIRED');

    // 2) Ma sai -> 401 MFA_INVALID (khong phai 401 credentials chung)
    const wrong = await ctx
      .http()
      .post('/api/v1/auth/signin')
      .send({ ...body, otp: '000000' })
      .expect(401);
    expect(wrong.body.error.code).toBe('AUTH_MFA_INVALID');

    // 3) Ma dung -> 200 + cap token that
    const code = await generate({ secret });
    const ok = await ctx
      .http()
      .post('/api/v1/auth/signin')
      .send({ ...body, otp: code })
      .expect(200);
    expect(ok.body.data.accessToken).toBeTypeOf('string');
    expect(ok.body.data.refreshToken).toBeTypeOf('string');
  });

  // ---------- S1: doi mat khau thu hoi cac khac ----------
  it('change-password giu phien hien tai, thu hoi phien khac (access token + refresh)', async () => {
    const { accessToken: tokenA } = await signupTakeTokens();

    // Phien B: mot user dang nhap lan thu hai
    const signinB = await ctx
      .http()
      .post('/api/v1/auth/signin')
      .send({ email: 'verify@example.com', password: 'StrongPassword123@' })
      .expect(200);
    const tokenB = signinB.body.data.accessToken as string;

    // Doi mat khau tu phien A
    await ctx
      .http()
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ currentPassword: 'StrongPassword123@', newPassword: 'NewStrongPass456@' })
      .expect(200);

    // Phien A van song
    await ctx.http().get('/api/v1/auth/me').set('Authorization', `Bearer ${tokenA}`).expect(200);

    // Phien B bi tu choi ngay lap tuc (access token deny-list - S4/S1)
    await ctx.http().get('/api/v1/auth/me').set('Authorization', `Bearer ${tokenB}`).expect(401);
  });

  // ---------- S4: signout thu hoi access token ngay ----------
  it('signout -> access token cua phien do bi tu choi ngay, khong cho JWT het han', async () => {
    const { accessToken } = await signupTakeTokens();
    await ctx.http().get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);

    await ctx.http().post('/api/v1/auth/signout').set('Authorization', `Bearer ${accessToken}`).expect(200);

    const revoked = await ctx
      .http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
    expect(revoked.body.error.code).toBe('AUTH_TOKEN_INVALID');
  });
});
