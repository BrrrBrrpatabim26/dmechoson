import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import type { KeyValueStore } from '../../core/interfaces/cache.interface.js';
import { parseDurationToSeconds } from '../../common/utils/duration.util.js';

/** Prefix key deny-list phiên đã thu hồi trong KeyValueStore (in-memory/Redis theo ON_REDIS). */
export const REVOKED_SESSION_KEY_PREFIX = 'revoked-session:';

/**
 * Deny-list phiên đã thu hồi — bù khoảng trống "access token JWT vô trạng thái" (S4).
 *
 * Sau signout/revoke, JWT cũ vẫn còn hạn ≤ JWT_EXPIRES_IN; marking key này khiến
 * JwtStrategy từ chối ngay. TTL = đúng vòng đời access token (hết hạn là token tự chết,
 * không cần giữ marker lâu hơn). Scale ngang >1 instance: bật ON_REDIS=true để
 * marker dùng chung — mặc định in-memory chỉ đủ cho 1 instance.
 */
@Injectable()
export class SessionRevocationService {
  private readonly ttlSeconds: number;

  constructor(
    @Inject(INJECTION_TOKENS.CACHE_STORE)
    private readonly cache: KeyValueStore,
    configService: ConfigService,
  ) {
    // JWT_EXPIRES_IN đã validate ở ConfigModule; parse ra giây cho TTL marker.
    this.ttlSeconds = parseDurationToSeconds(
      configService.get<string>('jwt.expiresIn', '15m'),
      900,
    );
  }

  async markRevoked(sessionId: string): Promise<void> {
    await this.cache.set(`${REVOKED_SESSION_KEY_PREFIX}${sessionId}`, '1', this.ttlSeconds);
  }

  async isRevoked(sessionId: string): Promise<boolean> {
    const hit = await this.cache.get(`${REVOKED_SESSION_KEY_PREFIX}${sessionId}`);
    return hit !== null;
  }
}
