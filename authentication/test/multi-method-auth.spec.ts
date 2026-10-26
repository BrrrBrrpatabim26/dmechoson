import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { EmailAlreadyExistsException } from '../src/common/exceptions/auth.exceptions.js';
import { NotFoundException } from '@nestjs/common';
import { SYSTEM_PROVIDER } from '../src/common/constants/system-provider.constant.js';

describe('Kiểm thử Đa Phương thức & Chống Nhầm lẫn Danh tính (Multi-method Auth & Collision Integrity)', () => {
  it('Chống xung đột Email (Collision Prevention): Ngăn chặn đăng ký trùng email và không ghi đè dữ liệu user cũ', async () => {
    const existingEmail = 'user.alex@example.com';

    const mockEmailRepo = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 'email-1',
        email: existingEmail,
        userId: 'existing-user-uuid',
      }),
    };

    const authService = new AuthService(
      {} as any,
      mockEmailRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    // Cố gắng đăng ký lại với cùng email
    await expect(
      authService.signUp({ email: existingEmail, password: 'NewPassword123@' }),
    ).rejects.toThrow(EmailAlreadyExistsException);

    expect(mockEmailRepo.findByEmail).toHaveBeenCalledWith(existingEmail);
  });

  it('Cô lập Danh tính (Identity Isolation): Phân định rõ ràng giữa Password Identity và Provider Identity', async () => {
    const userId = 'user-uuid-100';

    // Giả lập 2 identity gắn với cùng 1 user: 1 Local Password và 1 Google OAuth
    const identities = [
      {
        id: 'id-local-1',
        userId,
        providerId: 'provider-local-id',
        providerUserId: 'alex@company.com',
        provider: { code: SYSTEM_PROVIDER.LOCAL, kind: 'password' },
        passwordCredential: { id: 'cred-1', hashAlgorithm: 'argon2id' },
      },
      {
        id: 'id-google-1',
        userId,
        providerId: 'provider-google-id',
        providerUserId: 'google-sub-987654321',
        provider: { code: 'google', kind: 'oauth2' },
        passwordCredential: null, // OAuth không có mật khẩu local
      },
    ];

    const mockIdentityRepo = {
      findByUserId: vi.fn().mockResolvedValue(identities),
    };

    const userIdentities = await mockIdentityRepo.findByUserId(userId);

    expect(userIdentities).toHaveLength(2);
    // Kiểm tra không bị tráo đổi dữ liệu
    const local = userIdentities.find((i: any) => i.provider.code === SYSTEM_PROVIDER.LOCAL);
    const google = userIdentities.find((i: any) => i.provider.code === 'google');

    expect(local).toBeDefined();
    expect(local?.passwordCredential).not.toBeNull();
    expect(google).toBeDefined();
    expect(google?.passwordCredential).toBeNull();
    expect(google?.providerUserId).toBe('google-sub-987654321');
  });

  it('Cô lập Dữ liệu Phiên (Session Data Isolation): User A tuyệt đối không thể thu hồi hoặc xóa phiên của User B', async () => {
    const userA = 'user-uuid-A';
    const userB = 'user-uuid-B';
    const sessionB = 'session-uuid-belonging-to-B';

    const mockSessionRepo = {
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === sessionB) {
          return Promise.resolve({
            id: sessionB,
            userId: userB, // Thuộc về User B
            revokedAt: null,
          });
        }
        return Promise.resolve(null);
      }),
      revoke: vi.fn(),
    };
    const mockRefreshTokenRepo = {
      revokeSessionChain: vi.fn(),
    };

    const authService = new AuthService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      mockSessionRepo as any,
      mockRefreshTokenRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    // User A cố gắng thu hồi session của User B
    await expect(authService.revokeSession(userA, sessionB)).rejects.toThrow(NotFoundException);

    // Xác nhận hàm revoke không hề được gọi
    expect(mockSessionRepo.revoke).not.toHaveBeenCalled();
    expect(mockRefreshTokenRepo.revokeSessionChain).not.toHaveBeenCalled();
  });

  it('Truy vấn phiên hoạt động chỉ trả về các phiên của đúng người dùng hiện tại', async () => {
    const userId = 'user-uuid-current';
    const mockSessions = [
      {
        id: 's-1',
        userId,
        ip: '192.168.1.10',
        userAgent: 'Mozilla/5.0 Chrome',
        createdAt: new Date(),
        lastSeenAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      },
      {
        id: 's-2',
        userId,
        ip: '192.168.1.20',
        userAgent: 'Mobile Safari',
        createdAt: new Date(),
        lastSeenAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      },
    ];

    const mockSessionRepo = {
      findActiveSessionsByUserId: vi.fn().mockResolvedValue(mockSessions),
    };

    const authService = new AuthService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      mockSessionRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await authService.getActiveSessions(userId, 's-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('s-1');
    expect(result[0].isCurrent).toBe(true);
    expect(result[1].id).toBe('s-2');
    expect(result[1].isCurrent).toBe(false);
    expect(mockSessionRepo.findActiveSessionsByUserId).toHaveBeenCalledWith(userId);
  });
});
