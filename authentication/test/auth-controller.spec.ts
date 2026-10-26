import { describe, it, expect, vi } from 'vitest';
import { AuthV1Controller } from '../src/modules/auth/controllers/auth-v1.controller.js';
import { AuthV2Controller } from '../src/modules/auth/controllers/auth-v2.controller.js';
import type { IAuthService } from '../src/core/interfaces/auth-service.interface.js';
import type { Request } from 'express';
import type { TokenPayload } from '../src/core/interfaces/token-service.interface.js';

describe('Polymorphic Auth Controllers (Auth V1 & Auth V2 Đa hình)', () => {
  const mockAuthService: Partial<IAuthService> = {
    signUp: vi.fn().mockResolvedValue({
      accessToken: 'token_1',
      refreshToken: 'refresh_1',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: { id: 'u1', email: 'test@example.com' },
    }),
    signIn: vi.fn().mockResolvedValue({
      accessToken: 'token_2',
      refreshToken: 'refresh_2',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: { id: 'u1', email: 'test@example.com' },
    }),
    signOut: vi.fn().mockResolvedValue(undefined),
  };

  const mockRequest = {
    headers: { 'user-agent': 'Vitest-Agent' },
    ip: '127.0.0.1',
  } as unknown as Request;

  it('AuthV1Controller: xử lý đăng ký và trả về response bọc ApiResponse chuẩn', async () => {
    const v1Controller = new AuthV1Controller(mockAuthService as IAuthService);

    const res = await v1Controller.signup(
      { email: 'test@example.com', password: 'Password123@' },
      mockRequest,
    );

    expect(res.success).toBe(true);
    expect(res.data.accessToken).toBe('token_1');
    expect(res.timestamp).toBeDefined();
    expect(mockAuthService.signUp).toHaveBeenCalled();
  });

  it('AuthV2Controller: kế thừa BaseAuthController và cung cấp endpoint mở rộng V2', async () => {
    const mockMfaService = {
      listFactors: vi.fn().mockResolvedValue({ factors: [], remainingRecoveryCodes: 0 }),
    };
    const mockPasskeyService = {
      isPasskeySupported: vi.fn().mockResolvedValue(true),
    };

    const v2Controller = new AuthV2Controller(
      mockAuthService as IAuthService,
      mockMfaService as never,
      mockPasskeyService as never,
    );

    // Endpoint kế thừa và override
    const res = await v2Controller.signin(
      { email: 'test@example.com', password: 'Password123@' },
      mockRequest,
    );

    expect(res.success).toBe(true);
    expect(res.data.accessToken).toBe('token_2');
    expect(mockAuthService.signIn).toHaveBeenCalled();

    // Endpoint độc quyền trên V2
    const mockUser: TokenPayload = {
      sub: 'u1',
      email: 'test@example.com',
      sessionId: 'sess_1',
      roles: ['USER'],
      permissions: [],
    };

    const secRes = await v2Controller.getSecurityCapabilities(mockUser);
    expect(secRes.success).toBe(true);
    expect(secRes.data.passkeySupported).toBe(true);
    expect(secRes.data.mfaEnabled).toBe(false);
    expect(secRes.data.activeSessionId).toBe('sess_1');
  });

  it('AuthV1Controller: xử lý query getSessions, revokeSession và getAuditLogs chuẩn xác', async () => {
    const mockSessions = [
      {
        id: 'sess-1',
        userId: 'u1',
        ip: '127.0.0.1',
        userAgent: 'Chrome',
        createdAt: new Date(),
        lastSeenAt: new Date(),
        expiresAt: new Date(),
        isCurrent: true,
      },
    ];

    const mockPaginatedAudit = {
      items: [
        {
          id: 'log-1',
          userId: 'u1',
          eventType: 'auth.signin.success',
          success: true,
          ip: '127.0.0.1',
          userAgent: 'Chrome',
          metadata: {},
          createdAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    const fullMockService: Partial<IAuthService> = {
      ...mockAuthService,
      getActiveSessions: vi.fn().mockResolvedValue(mockSessions),
      revokeSession: vi.fn().mockResolvedValue(undefined),
      getAuditLogs: vi.fn().mockResolvedValue(mockPaginatedAudit),
    };

    const v1Controller = new AuthV1Controller(fullMockService as IAuthService);
    const mockUser: TokenPayload = {
      sub: 'u1',
      email: 'test@example.com',
      sessionId: 'sess-1',
      roles: ['USER'],
      permissions: ['auth:session:revoke', 'user:profile:read'],
    };

    // 1. Get Sessions
    const sessionsRes = await v1Controller.getSessions(mockUser);
    expect(sessionsRes.success).toBe(true);
    expect(sessionsRes.data).toHaveLength(1);
    expect(sessionsRes.data[0].id).toBe('sess-1');

    // 2. Revoke Session
    const revokeRes = await v1Controller.revokeSession('u1', 'sess-1');
    expect(revokeRes.success).toBe(true);
    expect(revokeRes.data.message).toContain('thành công');

    // 3. Get Audit Logs
    const auditRes = await v1Controller.getAuditLogs('u1', { page: 1, limit: 10 });
    expect(auditRes.success).toBe(true);
    expect(auditRes.data.items).toHaveLength(1);
    expect(auditRes.data.total).toBe(1);
  });
});
