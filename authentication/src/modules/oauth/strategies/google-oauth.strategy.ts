import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import type { OAuthProfile } from '../interfaces/oauth-profile.interface.js';
import type { KeyValueStore } from '../../../core/interfaces/cache.interface.js';
import { INJECTION_TOKENS } from '../../../core/tokens/injection.tokens.js';
import { InMemoryKeyValueStore } from '../../redis/in-memory-keyvalue.store.js';
import { createKvOAuthStateStore } from '../oauth-state.store.js';

/** S3: state CSRF bật mặc định; chỉ tắt khi OAUTH_STATE=false (opt-out tường minh). */
export function isOAuthStateEnabled(): boolean {
  return process.env.OAUTH_STATE !== 'false';
}

interface GoogleEmail {
  value?: string;
  verified?: boolean;
}

interface GoogleRawProfile {
  id?: string;
  email?: string;
  verified_email?: boolean;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Strategy OAuth 2.0 cho Google (OpenID Connect).
 *
 * Chiến lược luôn được đăng ký (dùng placeholder khi chưa có credentials thật)
 * để khong lam crash khoi dong module. GoogleOAuthGuard se chan request
 * và ném AUTH_METHOD_DISABLED nếu chưa cấu hình GOOGLE_CLIENT_ID/SECRET.
 */
@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleOAuthStrategy.name);

  constructor(
    configService: ConfigService,
    // Optional + fallback in-memory để unit test khởi tạo strategy không cần DI/Redis.
    // Không dùng tham số tính chất (this chưa khả dụng trước super()) — chỉ dùng lúc tạo options.
    @Optional() @Inject(INJECTION_TOKENS.CACHE_STORE) cache?: KeyValueStore,
  ) {
    const clientId = configService.get<string>('oauth.google.clientId', '') || 'NOT_CONFIGURED';
    const clientSecret = configService.get<string>('oauth.google.clientSecret', '') || 'NOT_CONFIGURED';
    const stateEnabled = isOAuthStateEnabled();

    super({
      clientID: clientId,
      clientSecret,
      callbackURL: configService.get<string>('oauth.google.callbackUrl', ''),
      scope: ['openid', 'profile', 'email'],
      // Chong CSRF/session-fixation tren luong OAuth: state + PKCE-luu-KV (S3).
      // State token giu trong KeyValueStore (Redis khi ON_REDIS=true -> dung chung multi-instance),
      // gan voi trinh khoi phat qua cookie httpOnly; KHONG can express-session.
      ...(stateEnabled
        ? {
            state: true,
            store: createKvOAuthStateStore(cache ?? new InMemoryKeyValueStore(), 'google') as never,
          }
        : {}),
    });

    if (clientId === 'NOT_CONFIGURED') {
      this.logger.warn('Chưa cấu hình GOOGLE_CLIENT_ID/SECRET - endpoints Google OAuth sẽ bị chặn.');
    } else {
      this.logger.log('Google OAuth Strategy đã khởi tạo (GOOGLE_CLIENT_ID hợp lệ)');
    }
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: { id?: string; emails?: GoogleEmail[]; displayName?: string; photos?: { value?: string }[]; _json?: GoogleRawProfile },
  ): OAuthProfile {
    const email = profile.emails?.[0]?.value ?? profile._json?.email ?? null;

    return {
      provider: 'google',
      providerUserId: profile.id ?? '',
      email,
      emailVerified:
        profile.emails?.[0]?.verified ?? profile._json?.email_verified ?? profile._json?.verified_email ?? false,
      displayName: profile.displayName ?? profile._json?.name ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? profile._json?.picture ?? null,
      accessToken,
      refreshToken,
    };
  }
}
