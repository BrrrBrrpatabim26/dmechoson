import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { AccountDisabledException } from '../../common/exceptions/auth.exceptions.js';
import type { ClientContext } from '../../core/interfaces/auth-service.interface.js';
import type {
  IAuthProviderRepository,
  IIdentityRepository,
  IUserEmailRepository,
  IUserRepository,
} from '../../core/interfaces/repositories.interface.js';
import type { IRbacService } from '../../core/interfaces/rbac.interface.js';
import type { IOAuthTokenRepository } from '../../core/interfaces/oauth-token.interface.js';
import type { AuthResponseDto } from '../auth/dto/auth-response.dto.js';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { AuthService } from '../auth/auth.service.js';
import type { OAuthProfile } from './interfaces/oauth-profile.interface.js';

/**
 * Dịch vụ xử lý đăng nhập / liên kết tài khoản qua OAuth 2.0 (Google, GitHub...).
 *
 * Tuân thủ mô hình Unified Identity: mọi provider đều trỏ về đúng 1 UserEntity,
 * auto-link theo email đã xác minh, chống chiếm quyền (identity đã thuộc user khác).
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,

    @Inject(INJECTION_TOKENS.USER_EMAIL_REPOSITORY)
    private readonly emailRepo: IUserEmailRepository,

    @Inject(INJECTION_TOKENS.AUTH_PROVIDER_REPOSITORY)
    private readonly providerRepo: IAuthProviderRepository,

    @Inject(INJECTION_TOKENS.IDENTITY_REPOSITORY)
    private readonly identityRepo: IIdentityRepository,

    @Inject(INJECTION_TOKENS.RBAC_SERVICE)
    private readonly rbacService: IRbacService,

    @Inject(INJECTION_TOKENS.OAUTH_TOKEN_REPOSITORY)
    private readonly oauthTokenRepo: IOAuthTokenRepository,

    private readonly authService: AuthService,
  ) {}

  async handleProviderLogin(
    profile: OAuthProfile,
    context?: ClientContext,
  ): Promise<AuthResponseDto> {
    const providerCode = profile.provider.trim().toLowerCase();
    const provider = await this.providerRepo.findOrCreate(
      providerCode,
      'oauth',
      `${providerCode} OAuth Provider`,
    );

    const existingIdentity = await this.identityRepo.findByProviderAndSubject(
      provider.id,
      profile.providerUserId,
    );

    // Trường hợp 1: Identity đã tồn tại -> đăng nhập bình thường
    if (existingIdentity) {
      const user = await this.userRepo.findById(existingIdentity.userId);
      if (!user) {
        throw new NotFoundException('Không tìm thấy tài khoản người dùng tương ứng');
      }
      if (user.status !== 'active') {
        throw new AccountDisabledException();
      }
      await this.persistProviderTokens(existingIdentity.id, profile);
      await this.identityRepo.updateLastLogin(existingIdentity.id);
      await this.userRepo.updateLastLogin(user.id);
      const accessControl = await this.rbacService.getUserAccess(user.id);
      const email = user.emails?.find((e) => e.isPrimary)?.email || profile.email || '';
      return this.authService.issueSessionAndTokens(
        user,
        existingIdentity,
        email,
        context,
        `auth.${providerCode}.signin.success`,
        accessControl,
      );
    }

    // Trường hợp 2: Identity mới -> auto-link theo email ĐÃ verify hoặc tạo user mới
    const normalizedEmail = profile.email ? profile.email.trim().toLowerCase() : null;
    let user = null as unknown as Awaited<ReturnType<IUserRepository['findById']>>;
    let isNewUser = false;

    if (normalizedEmail && profile.emailVerified) {
      const emailRecord = await this.emailRepo.findByEmail(normalizedEmail);
      if (emailRecord?.user) {
        user = emailRecord.user;
      }
    }

    if (!user) {
      isNewUser = true;
      const userId = uuidv7();
      user = await this.userRepo.create({
        id: userId,
        userName: profile.displayName || `${providerCode}_user`,
        locale: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        status: 'active',
        lastLoginAt: new Date(),
      });

      if (normalizedEmail) {
        await this.emailRepo.create({
          id: uuidv7(),
          userId: user.id,
          email: normalizedEmail,
          isPrimary: true,
          verifiedAt: profile.emailVerified ? new Date() : null,
        });
      }
    }

    if (user.status !== 'active') {
      throw new AccountDisabledException();
    }

    const identity = await this.identityRepo.create({
      id: uuidv7(),
      userId: user.id,
      providerId: provider.id,
      providerUserId: profile.providerUserId,
      email: normalizedEmail,
      emailVerified: profile.emailVerified,
      profile: {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      },
      lastLoginAt: new Date(),
    });

    await this.persistProviderTokens(identity.id, profile);

    const accessControl = isNewUser
      ? await this.rbacService.assignDefaultAccess(user.id)
      : await this.rbacService.getUserAccess(user.id);

    this.logger.log(
      `OAuth [${providerCode}] ${isNewUser ? 'tạo tài khoản mới' : 'liên kết'} cho user ${user.id}`,
    );

    const emailForToken = normalizedEmail || user.emails?.find((e) => e.isPrimary)?.email || '';
    return this.authService.issueSessionAndTokens(
      user,
      identity,
      emailForToken,
      context,
      isNewUser ? `auth.${providerCode}.signup.success` : `auth.${providerCode}.signin.success`,
      accessControl,
    );
  }

  private async persistProviderTokens(identityId: string, profile: OAuthProfile): Promise<void> {
    if (!profile.accessToken) {
      return;
    }
    await this.oauthTokenRepo.upsert({
      identityId,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken ?? null,
      scopes: profile.scopes ?? [],
      expiresAt: profile.expiresIn ? new Date(Date.now() + profile.expiresIn * 1000) : null,
    });
  }
}
