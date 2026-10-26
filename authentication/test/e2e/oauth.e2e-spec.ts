import { readFileSync } from 'fs';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import {
  createE2EApp,
  resetDb,
  DB_AVAILABLE,
  countRows,
  queryOne,
  type E2EContext,
} from './e2e-harness.js';
import { GoogleOAuthGuard } from '../../src/modules/oauth/guards/google-oauth.guard.js';
import { GitHubOAuthGuard } from '../../src/modules/oauth/guards/github-oauth.guard.js';

const describeDb = DB_AVAILABLE ? describe : describe.skip;

// ---- Nap credentials Google THAT tu gg-provider.json vao env (truoc khi tao app) ----
interface GgWeb {
  web: { client_id: string; client_secret: string };
}
const gg = JSON.parse(
  readFileSync(new URL('../../gg-provider.json', import.meta.url), 'utf8'),
) as GgWeb;

const ENV_BACKUP: Record<string, string | undefined> = {};
function applyOAuthEnv(): void {
  const vars: Record<string, string> = {
    GOOGLE_CLIENT_ID: gg.web.client_id,
    GOOGLE_CLIENT_SECRET: gg.web.client_secret,
    GOOGLE_CALLBACK_URL: 'http://localhost:3001/api/v1/auth/google/callback',
    GITHUB_CLIENT_ID: 'e2e-github-client-id',
    GITHUB_CLIENT_SECRET: 'e2e-github-client-secret',
    GITHUB_CALLBACK_URL: 'http://localhost:3001/api/v1/auth/github/callback',
  };
  for (const [k, v] of Object.entries(vars)) {
    ENV_BACKUP[k] = process.env[k];
    process.env[k] = v;
  }
}
function clearOAuthEnv(): void {
  for (const k of Object.keys(ENV_BACKUP)) delete process.env[k];
}

// Profile Google chuan hoa (dang duoc passport gui len req.user sau round-trip that).
const googleProfile = {
  provider: 'google',
  providerUserId: 'g-109823482734918237',
  email: 'oauthuser@gmail.com',
  emailVerified: true,
  displayName: 'OAuth User',
  avatarUrl: 'https://lh3.googleusercontent.com/avatar',
  accessToken: 'ya29.e2e-provider-access-token',
  refreshToken: 'ya29.e2e-provider-refresh-token',
  expiresIn: 3600,
  scopes: ['openid', 'email'],
};

describeDb('E2E (DB that) - OAuth Google & GitHub', () => {
  beforeAll(() => applyOAuthEnv());

  // ---------- (1) Redirect initiation: HTTP that + guard that ----------
  describe('OAuth redirect (guard that, 302 toi provider)', () => {
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

    it('GET /auth/google -> 302 toi accounts.google.com kem client_id tu file', async () => {
      const res = await ctx.http().get('/api/v1/auth/google').expect(302);
      const location = res.headers.location as string;
      expect(location).toContain('accounts.google.com');
      expect(location).toContain(`client_id=${gg.web.client_id}`);
      expect(location).toContain('redirect_uri=');
    });

    it('GET /auth/github -> 302 toi github.com/login/oauth/authorize', async () => {
      const res = await ctx.http().get('/api/v1/auth/github').expect(302);
      const location = res.headers.location as string;
      expect(location).toContain('github.com/login/oauth/authorize');
      expect(location).toContain('client_id=e2e-github-client-id');
    });
  });

  // ---------- (2) Callback -> DB that (stub bien gioi passport bang guard) ----------
  describe('OAuth callback -> tao/link tai khoan trong DB that', () => {
    let ctx: E2EContext;

    beforeAll(async () => {
      // Guard OAuth la boundary provider (round-trip Google khong chay duoc headless):
      // override = tiem req.user = profile da normalize, phan con lai (controller,
      // OAuthService, repository, DB) VAN THAT.
      ctx = await createE2EApp((builder) =>
        builder
          .overrideGuard(GoogleOAuthGuard)
          .useValue({
            canActivate: (c: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
              c.switchToHttp().getRequest().user = googleProfile;
              return true;
            },
          })
          .overrideGuard(GitHubOAuthGuard)
          .useValue({
            canActivate: (c: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
              c.switchToHttp().getRequest().user = { ...googleProfile, provider: 'github', providerUserId: 'gh-555', email: 'oauthuser@gmail.com' };
              return true;
            },
          }),
      );
    });
    afterAll(async () => {
      await ctx.app.close();
    });
    beforeEach(async () => {
      await resetDb(ctx.db);
    });

    it('callback Google (user moi) -> 200 + token, tao users/identities/oauth_tokens', async () => {
      const res = await ctx.http().get('/api/v1/auth/google/callback').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeTypeOf('string');

      expect(await countRows(ctx.db, 'users')).toBe(1);
      expect(await countRows(ctx.db, 'oauth_tokens')).toBe(1);
      const ident = await queryOne<{ provider_user_id: string }>(
        ctx.db,
        `SELECT i.provider_user_id FROM identities i
           JOIN auth_providers p ON p.id = i.provider_id WHERE p.code = 'google' LIMIT 1;`,
      );
      expect(ident?.provider_user_id).toBe('g-109823482734918237');
    });

    it('callback trung email da ton tai -> auto-link cung userId, khong tao user moi', async () => {
      // Tao user truoc qua signup (email khac hoa dieu kung auto-link)
      const signup = await ctx
        .http()
        .post('/api/v1/auth/signup')
        .send({ email: 'oauthuser@gmail.com', password: 'StrongPassword123@' })
        .expect(201);
      const originalUserId = signup.body.data.user.id;

      const res = await ctx.http().get('/api/v1/auth/google/callback').expect(200);
      expect(res.body.data.user.id).toBe(originalUserId);
      expect(await countRows(ctx.db, 'users')).toBe(1);
    });

    it('callback GitHub -> tao identity provider github', async () => {
      await ctx.http().get('/api/v1/auth/github/callback').expect(200);
      const ident = await queryOne<{ provider_user_id: string }>(
        ctx.db,
        `SELECT i.provider_user_id FROM identities i
           JOIN auth_providers p ON p.id = i.provider_id WHERE p.code = 'github' LIMIT 1;`,
      );
      expect(ident?.provider_user_id).toBe('gh-555');
    });
  });

  // ---------- (3) Khong configure creds -> 403 AUTH_METHOD_DISABLED ----------
  describe('OAuth khi CHUA configure credentials -> 403 AUTH_METHOD_DISABLED', () => {
    let ctx: E2EContext;

    beforeAll(async () => {
      clearOAuthEnv(); // xoa GOOGLE_*/GITHUB_* de guard chan
      ctx = await createE2EApp();
    });
    afterAll(async () => {
      await ctx.app.close();
      applyOAuthEnv(); // khuyen: tra lai env cho cac file khong anh huong
    });

    it('GET /auth/google chua creds -> 403', async () => {
      const res = await ctx.http().get('/api/v1/auth/google').expect(403);
      expect(res.body.error.code).toBe('AUTH_METHOD_DISABLED');
    });

    it('GET /auth/github chua creds -> 403', async () => {
      const res = await ctx.http().get('/api/v1/auth/github').expect(403);
      expect(res.body.error.code).toBe('AUTH_METHOD_DISABLED');
    });
  });
});
