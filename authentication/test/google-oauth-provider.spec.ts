import { readFileSync } from 'fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '@nestjs/common';
import { GoogleOAuthStrategy } from '../src/modules/oauth/strategies/google-oauth.strategy.js';
import { OAuthService } from '../src/modules/oauth/oauth.service.js';
import type { OAuthProfile } from '../src/modules/oauth/interfaces/oauth-profile.interface.js';

/**
 * Kiểm thử Google OAuth với credentials THẬT từ gg-provider.json.
 *
 * File này chứa Google OAuth "web" client (client_id + client_secret). Test xác minh:
 *  1. GoogleOAuthStrategy đọc đúng credentials từ file và khởi tạo không báo "NOT_CONFIGURED".
 *  2. validate() chuẩn hóa payload profile Google -> OAuthProfile nội bộ.
 *  3. OAuthService.handleProviderLogin chạy trọn vẹn (tạo user mới + auto-link email đã verify).
 *
 * Không gọi mạng / không cần DB: repos và AuthService được mock.
 */

interface GoogleWebClient {
  web: {
    client_id: string;
    client_secret: string;
    auth_uri: string;
    token_uri: string;
    javascript_origins: string[];
  };
}

function loadProviderFile(): GoogleWebClient {
  const url = new URL('../gg-provider.json', import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8')) as GoogleWebClient;
}

const provider = loadProviderFile();

const configServiceStub = {
  get: vi.fn((key: string, def = '') => {
    if (key === 'oauth.google.clientId') return provider.web.client_id;
    if (key === 'oauth.google.clientSecret') return provider.web.client_secret;
    if (key === 'oauth.google.callbackUrl') return 'http://localhost:3001/api/v1/auth/google/callback';
    return def;
  }),
};

// Payload profile thực tế mà passport-google-oauth20 truyền vào validate()
const rawGoogleProfile = {
  id: '109823482734918237456',
  displayName: 'Nguyễn Văn A',
  name: { familyName: 'Nguyễn', givenName: 'Văn A' },
  emails: [{ value: 'nguyenvana@gmail.com', type: 'google' }],
  photos: [{ value: 'https://lh3.googleusercontent.com/a/avatar' }],
  provider: 'google',
  _json: {
    sub: '109823482734918237456',
    email: 'nguyenvana@gmail.com',
    email_verified: true,
    name: 'Nguyễn Văn A',
    picture: 'https://lh3.googleusercontent.com/a/avatar',
  },
};

function buildOAuthMocks() {
  const user = (id: string) => ({
    id,
    status: 'active',
    userName: 'User',
    avatarUrl: null,
    emails: [{ id: 'em', email: 'nguyenvana@gmail.com', isPrimary: true }],
  });
  return {
    userRepo: {
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(async (u: { id: string }) => user(u.id)),
      updateLastLogin: vi.fn().mockResolvedValue(undefined),
    },
    emailRepo: {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      findByUserId: vi.fn().mockResolvedValue([]),
    },
    providerRepo: { findOrCreate: vi.fn(async () => ({ id: 'prov-google', code: 'google' })) },
    identityRepo: {
      findByProviderAndSubject: vi.fn().mockResolvedValue(null),
      create: vi.fn(async (i: { id: string; userId: string }) => ({ id: i.id, userId: i.userId })),
      updateLastLogin: vi.fn().mockResolvedValue(undefined),
    },
    rbacService: {
      assignDefaultAccess: vi.fn().mockResolvedValue({ roles: ['USER'], permissions: [] }),
      getUserAccess: vi.fn().mockResolvedValue({ roles: ['USER'], permissions: [] }),
    },
    oauthTokenRepo: { upsert: vi.fn().mockResolvedValue(undefined) },
    authService: {
      issueSessionAndTokens: vi.fn(async (_u: unknown, _i: unknown, email: string, _c: unknown, eventType: string) => ({
        email,
        eventType,
      })),
    },
  };
}

function buildService(mocks: ReturnType<typeof buildOAuthMocks>): OAuthService {
  return new OAuthService(
    mocks.userRepo as never,
    mocks.emailRepo as never,
    mocks.providerRepo as never,
    mocks.identityRepo as never,
    mocks.rbacService as never,
    mocks.oauthTokenRepo as never,
    mocks.authService as never,
  );
}

describe('Kiểm thử Google OAuth với gg-provider.json (credentials thật)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  it('gg-provider.json chứa web client hợp lệ (client_id & client_secret)', () => {
    expect(provider.web.client_id).toMatch(/googleusercontent\.com$/);
    expect(provider.web.client_secret).toMatch(/^GOCSPX-/);
    // Callback localhost:3001 nằm trong danh sách javascript_origins đã đăng ký
    expect(provider.web.javascript_origins).toContain('http://localhost:3001');
  });

  it('GoogleOAuthStrategy nạp credentials thật -> khởi tạo OK, KHÔNG cảnh báo NOT_CONFIGURED', () => {
    const strategy = new GoogleOAuthStrategy(configServiceStub as never);

    expect(strategy).toBeInstanceOf(GoogleOAuthStrategy);
    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('GOOGLE_CLIENT_ID'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('GOOGLE_CLIENT_ID hợp lệ'));
  });

  it('validate() chuẩn hóa profile Google -> OAuthProfile đúng chuẩn nội bộ', () => {
    const strategy = new GoogleOAuthStrategy(configServiceStub as never);

    const normalized = strategy.validate('ya29.access-token', 'refresh-token', rawGoogleProfile as never);

    const profile: OAuthProfile = normalized;
    expect(profile.provider).toBe('google');
    expect(profile.providerUserId).toBe('109823482734918237456');
    expect(profile.email).toBe('nguyenvana@gmail.com');
    expect(profile.emailVerified).toBe(true);
    expect(profile.displayName).toBe('Nguyễn Văn A');
    expect(profile.avatarUrl).toBe('https://lh3.googleusercontent.com/a/avatar');
    expect(profile.accessToken).toBe('ya29.access-token');
  });

  it('handleProviderLogin: tài khoản Google mới -> tạo user + identity, lưu provider token (signup)', async () => {
    const strategy = new GoogleOAuthStrategy(configServiceStub as never);
    const profile = strategy.validate('ya29.access-token', 'rt', rawGoogleProfile as never);

    const mocks = buildOAuthMocks();
    const service = buildService(mocks);

    const result = await service.handleProviderLogin(profile);

    expect(mocks.userRepo.create).toHaveBeenCalledTimes(1);
    expect(mocks.identityRepo.create).toHaveBeenCalledTimes(1);
    expect(mocks.rbacService.assignDefaultAccess).toHaveBeenCalledTimes(1);
    // Provider access token được mã hóa & lưu vào oauth_tokens
    expect(mocks.oauthTokenRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'ya29.access-token' }),
    );
    expect((result as unknown as { eventType: string }).eventType).toBe('auth.google.signup.success');
  });

  it('handleProviderLogin: email Google đã verify trùng user hiện có -> auto-link, không tạo user mới', async () => {
    const strategy = new GoogleOAuthStrategy(configServiceStub as never);
    const profile = strategy.validate('ya29.access-token', 'rt', rawGoogleProfile as never);

    const mocks = buildOAuthMocks();
    const existing = { id: 'existing-user', status: 'active', userName: 'Old', emails: profile.email ? [{ email: profile.email, isPrimary: true }] : [] };
    mocks.emailRepo.findByEmail.mockResolvedValue({ id: 'em', email: 'nguyenvana@gmail.com', verifiedAt: new Date(), user: existing });

    const service = buildService(mocks);
    const result = await service.handleProviderLogin(profile);

    expect(mocks.userRepo.create).not.toHaveBeenCalled();
    expect(mocks.rbacService.getUserAccess).toHaveBeenCalledWith('existing-user');
    expect((result as unknown as { eventType: string }).eventType).toBe('auth.google.signin.success');
  });
});
