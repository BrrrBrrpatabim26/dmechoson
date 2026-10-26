import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import type { OAuthProfile } from '../interfaces/oauth-profile.interface.js';
import type { KeyValueStore } from '../../../core/interfaces/cache.interface.js';
import { INJECTION_TOKENS } from '../../../core/tokens/injection.tokens.js';
import { InMemoryKeyValueStore } from '../../redis/in-memory-keyvalue.store.js';
import { createKvOAuthStateStore } from '../oauth-state.store.js';
import { isOAuthStateEnabled } from './google-oauth.strategy.js';

interface GitHubEmail {
  value?: string;
  verified?: boolean;
  primary?: boolean;
}

interface GitHubRawProfile {
  id?: number;
  login?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

/**
 * Strategy OAuth 2.0 cho GitHub.
 *
 * Tương tự GoogleOAuthStrategy: luôn đăng ký với placeholder,
 * GitHubOAuthGuard chặn request khi chưa cấu hình GITHUB_CLIENT_ID/SECRET.
 */
@Injectable()
export class GitHubOAuthStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubOAuthStrategy.name);

  constructor(
    configService: ConfigService,
    // Chỉ dùng lúc tạo options (this chưa khả dụng trước super()); fallback in-memory cho unit test.
    @Optional() @Inject(INJECTION_TOKENS.CACHE_STORE) cache?: KeyValueStore,
  ) {
    const clientId = configService.get<string>('oauth.github.clientId', '') || 'NOT_CONFIGURED';
    const clientSecret = configService.get<string>('oauth.github.clientSecret', '') || 'NOT_CONFIGURED';
    const stateEnabled = isOAuthStateEnabled();

    super({
      clientID: clientId,
      clientSecret,
      callbackURL: configService.get<string>('oauth.github.callbackUrl', ''),
      scope: ['user:email', 'read:user'],
      // Chong CSRF (S3): state bat mac dinh, luu trong KeyValueStore + cookie httpOnly — khong can
      // express-session. Typing github2 khai `state: string` nen ep kieu options object.
      ...(stateEnabled
        ? {
            state: true,
            store: createKvOAuthStateStore(cache ?? new InMemoryKeyValueStore(), 'github') as never,
          }
        : {}),
    } as never);

    if (clientId === 'NOT_CONFIGURED') {
      this.logger.warn('Chưa cấu hình GITHUB_CLIENT_ID/SECRET - endpoints GitHub OAuth sẽ bị chặn.');
    } else {
      this.logger.log('GitHub OAuth Strategy đã khởi tạo (GITHUB_CLIENT_ID hợp lệ)');
    }
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      id?: string;
      username?: string;
      displayName?: string;
      emails?: GitHubEmail[];
      photos?: { value?: string }[];
      _json?: GitHubRawProfile;
    },
  ): OAuthProfile {
    const primaryEmail =
      profile.emails?.find((e) => e.primary) || profile.emails?.find((e) => e.verified) || profile.emails?.[0];

    return {
      provider: 'github',
      providerUserId: profile.id ?? String(profile._json?.id ?? ''),
      email: primaryEmail?.value ?? profile._json?.email ?? null,
      emailVerified: primaryEmail?.verified ?? false,
      displayName: profile.displayName ?? profile._json?.name ?? profile._json?.login ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? profile._json?.avatar_url ?? null,
      accessToken,
      refreshToken,
    };
  }
}
