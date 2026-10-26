import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthService } from '../src/modules/oauth/oauth.service.js';
import type { OAuthProfile } from '../src/modules/oauth/interfaces/oauth-profile.interface.js';

const fakeUser = (id: string, status = 'active') => ({
  id,
  status,
  userName: 'User Test',
  avatarUrl: null,
  emails: [{ id: 'em-1', email: 'google@gmail.com', isPrimary: true }],
});

const fakeIdentity = (id: string, userId: string) => ({
  id,
  userId,
  providerId: 'provider-google',
  providerUserId: 'g-109823482734918237',
});

function buildMocks() {
  const userRepo = {
    findById: vi.fn(),
    create: vi.fn(async (u: { id: string }) => fakeUser(u.id)),
    updateLastLogin: vi.fn().mockResolvedValue(undefined),
  };
  const emailRepo = {
    findByEmail: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(undefined),
    findByUserId: vi.fn().mockResolvedValue([]),
  };
  const providerRepo = {
    findOrCreate: vi.fn(async () => ({ id: 'provider-google', code: 'google' })),
  };
  const identityRepo = {
    findByProviderAndSubject: vi.fn().mockResolvedValue(null),
    create: vi.fn(async (i: { id: string; userId: string }) => fakeIdentity(i.id, i.userId)),
    updateLastLogin: vi.fn().mockResolvedValue(undefined),
  };
  const rbacService = {
    assignDefaultAccess: vi.fn().mockResolvedValue({ roles: ['USER'], permissions: [] }),
    getUserAccess: vi.fn().mockResolvedValue({ roles: ['USER'], permissions: [] }),
  };
  const oauthTokenRepo = { upsert: vi.fn().mockResolvedValue(undefined) };
  const authService = {
    issueSessionAndTokens: vi.fn(async (_user: unknown, _identity: unknown, email: string, _ctx: unknown, eventType: string) => ({
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: { email },
      eventType,
    })),
  };

  return { userRepo, emailRepo, providerRepo, identityRepo, rbacService, oauthTokenRepo, authService };
}

function buildService(mocks: ReturnType<typeof buildMocks>): OAuthService {
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

const googleProfile: OAuthProfile = {
  provider: 'google',
  providerUserId: 'g-109823482734918237',
  email: 'Google@Gmail.com',
  emailVerified: true,
  displayName: 'Nguyễn Văn A (Google)',
  avatarUrl: 'https://lh3.googleusercontent.com/avatar',
  accessToken: 'ya29.provider-access-token',
};

describe('Kiểm thử OAuth Callback (Google/GitHub Unified Identity)', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('Profile mới hoàn toàn -> tạo user + identity, gán quyền mặc định, cấp token (signup)', async () => {
    const service = buildService(mocks);

    await service.handleProviderLogin(googleProfile);

    expect(mocks.userRepo.create).toHaveBeenCalledTimes(1);
    expect(mocks.emailRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'google@gmail.com', isPrimary: true }),
    );
    expect(mocks.rbacService.assignDefaultAccess).toHaveBeenCalledTimes(1);
    expect(mocks.authService.issueSessionAndTokens.mock.lastCall?.[4]).toBe('auth.google.signup.success');
    // Provider token được lưu vào bảng oauth_tokens
    expect(mocks.oauthTokenRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'ya29.provider-access-token' }),
    );
  });

  it('Email đã verify thuộc user khác -> auto-link identity vào userId hiện có, KHÔNG tạo user mới', async () => {
    const existingUser = fakeUser('existing-user-1');
    mocks.emailRepo.findByEmail.mockResolvedValue({
      id: 'em-1',
      email: 'google@gmail.com',
      verifiedAt: new Date(),
      user: existingUser,
    });

    const service = buildService(mocks);
    await service.handleProviderLogin(googleProfile);

    expect(mocks.userRepo.create).not.toHaveBeenCalled();
    expect(mocks.rbacService.getUserAccess).toHaveBeenCalledWith('existing-user-1');
    expect(mocks.authService.issueSessionAndTokens.mock.lastCall?.[4]).toBe('auth.google.signin.success');
  });

  it('Identity đã tồn tại -> đăng nhập trực tiếp, không tạo user/identity mới', async () => {
    mocks.identityRepo.findByProviderAndSubject.mockResolvedValue(fakeIdentity('id-1', 'existing-user-1'));
    mocks.userRepo.findById.mockResolvedValue(fakeUser('existing-user-1'));

    const service = buildService(mocks);
    await service.handleProviderLogin(googleProfile);

    expect(mocks.userRepo.create).not.toHaveBeenCalled();
    expect(mocks.identityRepo.create).not.toHaveBeenCalled();
    expect(mocks.authService.issueSessionAndTokens.mock.lastCall?.[4]).toBe('auth.google.signin.success');
  });

  it('Email CHƯA được provider verify -> không auto-link, tạo user mới (chống chiếm tài khoản)', async () => {
    mocks.emailRepo.findByEmail.mockResolvedValue({
      id: 'em-1',
      email: 'google@gmail.com',
      verifiedAt: new Date(),
      user: fakeUser('victim-user'),
    });

    const service = buildService(mocks);
    await service.handleProviderLogin({ ...googleProfile, emailVerified: false });

    expect(mocks.userRepo.create).toHaveBeenCalledTimes(1);
    expect(mocks.authService.issueSessionAndTokens.mock.lastCall?.[4]).toBe('auth.google.signup.success');
  });
});
