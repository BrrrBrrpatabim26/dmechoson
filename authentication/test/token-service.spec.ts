import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from '../src/modules/token/jwt-token.service.js';

describe('JwtTokenService (Quản lý JWT & Token Rotation)', () => {
  let tokenService: JwtTokenService;

  beforeEach(() => {
    const configService = new ConfigService({
      jwt: {
        secret: 'test-secret-key-at-least-32-characters-long',
        expiresIn: '15m',
        refreshExpiresDays: 7,
      },
    });
    const jwtService = new JwtService();
    tokenService = new JwtTokenService(jwtService, configService);
  });

  it('Tạo cặp token và giải mã Access Token thành công', async () => {
    const payload = {
      sub: '0192e47b-891a-7b3b-9e4a-9b19e2300000',
      email: 'test@example.com',
      userName: 'Test User',
    };
    const sessionId = '0192e47b-891a-7b3b-9e4a-9b19e2300001';

    const tokens = await tokenService.generateTokenPair(payload, sessionId);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.tokenType).toBe('Bearer');
    expect(tokens.expiresIn).toBe(900); // 15 phút = 900 giây

    const decoded = await tokenService.verifyAccessToken(tokens.accessToken);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.sessionId).toBe(sessionId);
  });

  it('Băm Refresh Token bằng SHA-256 an toàn và nhất quán', () => {
    const rawToken = tokenService.generateRawRefreshToken();
    expect(rawToken.length).toBeGreaterThanOrEqual(40);

    const hash1 = tokenService.hashRefreshToken(rawToken);
    const hash2 = tokenService.hashRefreshToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(rawToken);
    expect(hash1.length).toBe(64); // SHA-256 hex string có độ dài 64 ký tự
  });
});
