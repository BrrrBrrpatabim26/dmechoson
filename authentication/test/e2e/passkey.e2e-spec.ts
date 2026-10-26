import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';

// Boundary WebAuthn: giữ nguyên 2 hàm generate* (tạo challenge THAT), CHỈ stub 2 hàm
// verify* (bước kiểm tra chữ ký cần authenticator vật lý -> không chạy được headless).
vi.mock('@simplewebauthn/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@simplewebauthn/server')>();
  return {
    ...actual,
    verifyRegistrationResponse: vi.fn(async (opts: { response: { rawId?: string; id?: string } }) => {
      const rawId = opts.response.rawId ?? opts.response.id ?? '';
      return {
        verified: true,
        registrationInfo: {
          fmt: 'none' as const,
          aaguid: '00000000-0000-0000-0000-000000000000',
          credential: {
            id: rawId,
            publicKey: new Uint8Array([0x04, 0x01, 0x02, 0x03]),
            counter: 0,
            transports: [],
          },
          credentialType: 'public-key' as const,
          attestationObject: new Uint8Array(),
          userVerified: true,
          credentialDeviceType: 'singleDevice' as const,
          credentialBackedUp: false,
          origin: 'http://localhost:3001',
          rpID: 'localhost',
        },
      };
    }),
    verifyAuthenticationResponse: vi.fn(async () => ({
      verified: true,
      authenticationInfo: {
        credentialID: 'mock-cred',
        newCounter: 5,
        userVerified: true,
        credentialDeviceType: 'singleDevice' as const,
        credentialBackedUp: false,
        origin: 'http://localhost:3001',
        rpID: 'localhost',
      },
    })),
  };
});

import {
  createE2EApp,
  resetDb,
  DB_AVAILABLE,
  countRows,
  type E2EContext,
} from './e2e-harness.js';

const describeDb = DB_AVAILABLE ? describe : describe.skip;

// rawId base64url dùng chung cho register & authenticate để lookup credential khớp nhau.
const RAW_ID = 'Aic1b7GcO1yBz8pQK0mVwXyz';
const fakeAssertion = () => ({
  id: RAW_ID,
  rawId: RAW_ID,
  response: { clientDataJSON: 'e30', authenticatorData: 'AAAA', signature: 'sig', userHandle: null },
  clientExtensionResults: {},
  type: 'public-key' as const,
});

describeDb('E2E (DB thật) - Passkey (WebAuthn), stub riêng bước verify crypto', () => {
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

  async function signupTakeToken(): Promise<string> {
    const res = await ctx
      .http()
      .post('/api/v1/auth/signup')
      .send({ email: 'pk@example.com', password: 'StrongPassword123@' })
      .expect(201);
    return res.body.data.accessToken as string;
  }

  it('passkey: register options (Bearer) -> trả challenge + verification options', async () => {
    const accessToken = await signupTakeToken();
    const res = await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/register/options')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.challenge).toBeTypeOf('string');
    expect(res.body.data.challengeId).toBeTypeOf('string');
    expect(res.body.data.rp).toBeDefined();
    expect(res.body.data.user).toBeDefined();
  });

  it('passkey: register verify -> lưu passkey_credentials (identity passkey + user)', async () => {
    const accessToken = await signupTakeToken();
    const opts = await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/register/options')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/register/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ challengeId: opts.body.data.challengeId, response: fakeAssertion(), deviceName: 'E2E Key' })
      .expect(200);

    expect(await countRows(ctx.db, 'passkey_credentials')).toBe(1);
  });

  it('passkey: authenticate (public) options -> verify -> 200 + cặp token JWT', async () => {
    const accessToken = await signupTakeToken();

    // Đăng ký passkey trước
    const rOpts = await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/register/options')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/register/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ challengeId: rOpts.body.data.challengeId, response: fakeAssertion() })
      .expect(200);

    // Đăng nhập bằng passkey (public)
    const aOpts = await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/authenticate/options')
      .send({ email: 'pk@example.com' })
      .expect(200);
    expect(aOpts.body.data.challengeId).toBeTypeOf('string');

    const login = await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/authenticate/verify')
      .send({ challengeId: aOpts.body.data.challengeId, response: fakeAssertion() })
      .expect(200);
    expect(login.body.data.accessToken).toBeTypeOf('string');
    expect(login.body.data.refreshToken).toBeTypeOf('string');
  });

  it('passkey: challenge dùng 2 lần -> 400 (single-use)', async () => {
    const accessToken = await signupTakeToken();
    const opts = await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/register/options')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = { challengeId: opts.body.data.challengeId, response: fakeAssertion() };
    await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/register/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(body)
      .expect(200);

    await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/register/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(body)
      .expect(400);
  });

  it('passkey authenticate: email không tồn tại -> options vẫn 200 nhưng không tạo user', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/auth/mfa/passkey/authenticate/options')
      .send({ email: 'ghost@example.com' })
      .expect(200);
    expect(res.body.data.challengeId).toBeTypeOf('string');
    expect(await countRows(ctx.db, 'users')).toBe(0);
  });
});
