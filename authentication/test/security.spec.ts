import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { JwtTokenService } from '../src/modules/token/jwt-token.service.js';
import { PermissionsGuard } from '../src/common/guards/permissions.guard.js';
import { RolesGuard } from '../src/common/guards/roles.guard.js';
import { TokenExpiredException, TokenInvalidException, TokenReusedException, AccountLockedException } from '../src/common/exceptions/auth.exceptions.js';
import { ForbiddenException } from '../src/common/exceptions/forbidden.exception.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { Argon2PasswordHasher } from '../src/modules/hashing/argon2-hasher.service.js';
import { BcryptPasswordHasher } from '../src/modules/hashing/bcrypt-hasher.service.js';
import { PERMISSION_CODES } from '../src/common/constants/permission-codes.constant.js';

describe('Kiểm thử An toàn Bảo mật (Security & Vulnerability Tests)', () => {
  let tokenService: JwtTokenService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      jwt: {
        secret: 'super-secure-production-ready-jwt-secret-key-32chars',
        expiresIn: '1s', // 1s để test expire
        refreshExpiresDays: 7,
      },
    });
    jwtService = new JwtService();
    tokenService = new JwtTokenService(jwtService, configService);
  });

  describe('1. Kiểm thử Toàn vẹn Token & Chống Giả mạo (Token Tampering)', () => {
    it('Từ chối token khi chữ ký (Signature) bị sửa đổi hoặc giả mạo', async () => {
      const payload = { sub: 'user-123', email: 'test@example.com', roles: ['USER'], permissions: [] };
      const tokens = await tokenService.generateTokenPair(payload, 'session-123');

      // Giả lập hacker tráo đổi signature ở phần đuôi JWT
      const parts = tokens.accessToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignaturehere1234567890`;

      await expect(tokenService.verifyAccessToken(tamperedToken)).rejects.toThrow(TokenInvalidException);
    });

    it('Từ chối token khi đã hết hạn sử dụng (Expired Token)', async () => {
      const payload = { sub: 'user-123', email: 'test@example.com', roles: ['USER'], permissions: [] };
      const tokens = await tokenService.generateTokenPair(payload, 'session-123');

      // Chờ 1.1s để token hết hạn (hạn 1s)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      await expect(tokenService.verifyAccessToken(tokens.accessToken)).rejects.toThrow(TokenExpiredException);
    });

    it('Ngăn chặn tấn công thuật toán rỗng (None Algorithm Attack)', async () => {
      // Header với "alg": "none"
      const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const fakePayload = Buffer.from(JSON.stringify({ sub: 'admin-id', roles: ['ADMIN'] })).toString('base64url');
      const noneToken = `${fakeHeader}.${fakePayload}.`;

      await expect(tokenService.verifyAccessToken(noneToken)).rejects.toThrow(TokenInvalidException);
    });
  });

  describe('2. Kiểm thử Tấn công Tái sử dụng Refresh Token (Token Reuse Detection)', () => {
    it('Phát hiện token đã dùng lại -> Lập tức thu hồi toàn bộ phiên và chuỗi token', async () => {
      const mockSessionRepo = {
        findActiveById: vi.fn(),
        revoke: vi.fn().mockResolvedValue(undefined),
        findById: vi.fn(),
      };
      const mockRefreshTokenRepo = {
        findByTokenHash: vi.fn().mockResolvedValue({
          id: 'token-rec-1',
          sessionId: 'session-compromised',
          tokenHash: 'hash-1',
          usedAt: new Date(), // Đã được sử dụng trước đó!
          revokedAt: null,
          expiresAt: new Date(Date.now() + 100000),
        }),
        revokeSessionChain: vi.fn().mockResolvedValue(undefined),
      };
      const mockAuditRepo = { record: vi.fn().mockResolvedValue({}) };

      const authService = new AuthService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockSessionRepo as any,
        mockRefreshTokenRepo as any,
        {} as any,
        mockAuditRepo as any,
        {} as any,
        {} as any,
        tokenService,
      );

      // Cố tình gửi lại refresh token cũ đã dùng
      await expect(
        authService.refreshToken({ refreshToken: 'some-used-refresh-token' }),
      ).rejects.toThrow(TokenReusedException);

      // Xác minh hệ thống đã lập tức phong sát chuỗi token và session
      expect(mockRefreshTokenRepo.revokeSessionChain).toHaveBeenCalledWith('session-compromised');
      expect(mockSessionRepo.revoke).toHaveBeenCalledWith('session-compromised');
      expect(mockAuditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'auth.token.reuse_detected',
          success: false,
        }),
      );
    });
  });

  describe('3. Kiểm thử Chống Leo quyền (Privilege Escalation) PBAC / RBAC', () => {
    it('Chặn người dùng thường truy cập endpoint yêu cầu Role ADMIN (403 Forbidden)', () => {
      const reflector = new Reflector();
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      const guard = new RolesGuard(reflector);

      const context = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { sub: 'u1', roles: ['USER'], permissions: ['user:profile:read'] },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('Chặn người dùng thiếu quyền hạt nhân bắt buộc (PermissionsGuard)', () => {
      const reflector = new Reflector();
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PERMISSION_CODES.USER_MANAGE]);
      const guard = new PermissionsGuard(reflector);

      const context = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { sub: 'u1', roles: ['USER'], permissions: [PERMISSION_CODES.USER_PROFILE_READ] },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('4. Kiểm thử Chống Vét cạn (Brute Force Protection) & Khóa Tài khoản', () => {
    it('Báo lỗi AccountLockedException khi số lần nhập sai mật khẩu vượt ngưỡng', async () => {
      const mockPasswordRepo = {
        findByIdentityId: vi.fn().mockResolvedValue({
          id: 'cred-1',
          passwordHash: 'hash',
          hashAlgorithm: 'argon2id',
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // Bị khóa 15 phút
        }),
        recordFailedAttempt: vi.fn(),
      };
      const mockEmailRepo = {
        findByEmail: vi.fn().mockResolvedValue({
          user: { id: 'u1', status: 'active', userName: 'Test' },
        }),
      };
      const mockProviderRepo = {
        findByCode: vi.fn().mockResolvedValue({ id: 'p1' }),
      };
      const mockIdentityRepo = {
        findByProviderAndSubject: vi.fn().mockResolvedValue({ id: 'i1' }),
      };
      const mockAuditRepo = { record: vi.fn().mockResolvedValue({}) };

      const authService = new AuthService(
        {} as any,
        mockEmailRepo as any,
        mockProviderRepo as any,
        mockIdentityRepo as any,
        mockPasswordRepo as any,
        {} as any,
        {} as any,
        {} as any,
        mockAuditRepo as any,
        {} as any,
        {} as any,
        {} as any,
      );

      await expect(
        authService.signIn({ email: 'user@test.com', password: 'WrongPassword123@' }),
      ).rejects.toThrow(AccountLockedException);
    });
  });

  describe('5. Kiểm thử Tính Ngẫu nhiên của Salt & Chống Tấn công Timing', () => {
    let hashConfigService: ConfigService;

    beforeEach(() => {
      hashConfigService = new ConfigService({
        hash: {
          defaultAlgorithm: 'argon2id',
          argon2MemoryCost: 19456,
          argon2TimeCost: 2,
          argon2Parallelism: 1,
          bcryptRounds: 10,
        },
      });
    });

    it('Băm cùng một mật khẩu bằng Argon2id sinh ra 2 chuỗi hash với salt hoàn toàn khác nhau', async () => {
      const hasher = new Argon2PasswordHasher(hashConfigService);
      const password = 'UltraSecurePassword2026!';

      const hash1 = await hasher.hash(password);
      const hash2 = await hasher.hash(password);

      expect(hash1).not.toBe(hash2);
      expect(await hasher.verify(password, hash1)).toBe(true);
      expect(await hasher.verify(password, hash2)).toBe(true);
      expect(await hasher.verify('WrongPassword!', hash1)).toBe(false);
    });

    it('Băm cùng một mật khẩu bằng Bcrypt sinh ra 2 chuỗi hash với salt ngẫu nhiên khác nhau', async () => {
      const hasher = new BcryptPasswordHasher(hashConfigService);
      const password = 'UltraSecurePassword2026!';

      const hash1 = await hasher.hash(password);
      const hash2 = await hasher.hash(password);

      expect(hash1).not.toBe(hash2);
      expect(await hasher.verify(password, hash1)).toBe(true);
      expect(await hasher.verify(password, hash2)).toBe(true);
      expect(await hasher.verify('WrongPassword!', hash1)).toBe(false);
    });
  });
});
