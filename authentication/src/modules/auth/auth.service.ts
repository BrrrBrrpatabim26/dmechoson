import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v7 as uuidv7 } from 'uuid';
import { SYSTEM_PROVIDER } from '../../common/constants/system-provider.constant.js';
import { AUTH_METHODS } from '../../common/constants/auth-methods.constant.js';
import {
  AccountDisabledException,
  AccountLockedException,
  AuthMethodDisabledException,
  EmailAlreadyExistsException,
  IdentityAlreadyLinkedException,
  InvalidCredentialsException,
  MfaInvalidException,
  MfaRequiredException,
  PasswordSameAsCurrentException,
  TokenExpiredException,
  TokenInvalidException,
  TokenReusedException,
} from '../../common/exceptions/auth.exceptions.js';
import { BaseAuthService } from '../../core/abstracts/base-auth.service.abstract.js';
import type { ClientContext } from '../../core/interfaces/auth-service.interface.js';
import type { IPasswordHasher } from '../../core/interfaces/password-hasher.interface.js';
import type { IRbacService } from '../../core/interfaces/rbac.interface.js';
import type { IOtpService } from '../../core/interfaces/otp-service.interface.js';
import type {
  IAuthProviderRepository,
  IDeviceRepository,
  IIdentityRepository,
  ILoginAuditLogRepository,
  IPasswordCredentialRepository,
  IRefreshTokenRepository,
  ISessionRepository,
  IUserEmailRepository,
  IUserRepository,
} from '../../core/interfaces/repositories.interface.js';
import type { ITokenService } from '../../core/interfaces/token-service.interface.js';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { UserEntity } from '../../entities/user.entity.js';
import { UserIdentity } from '../../entities/identity.entity.js';
import { PasswordHasherService } from '../hashing/password-hasher.service.js';
import { MfaService } from '../mfa/mfa.service.js';
import { SessionRevocationService } from '../token/session-revocation.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { SigninDto } from './dto/signin.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { UserProfileDto } from './dto/user-profile.dto.js';
import { SessionResponseDto } from './dto/session-response.dto.js';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto.js';
import { AuditLogResponseDto } from './dto/audit-log-response.dto.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { SendMagicLinkDto } from './dto/send-magic-link.dto.js';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto.js';
import { LinkIdentityDto } from './dto/link-identity.dto.js';
import { PaginatedResult } from '../../common/responses/paginated-response.dto.js';

@Injectable()
export class AuthService extends BaseAuthService {
  constructor(
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,

    @Inject(INJECTION_TOKENS.USER_EMAIL_REPOSITORY)
    private readonly emailRepo: IUserEmailRepository,

    @Inject(INJECTION_TOKENS.AUTH_PROVIDER_REPOSITORY)
    private readonly providerRepo: IAuthProviderRepository,

    @Inject(INJECTION_TOKENS.IDENTITY_REPOSITORY)
    private readonly identityRepo: IIdentityRepository,

    @Inject(INJECTION_TOKENS.PASSWORD_CREDENTIAL_REPOSITORY)
    private readonly passwordRepo: IPasswordCredentialRepository,

    @Inject(INJECTION_TOKENS.SESSION_REPOSITORY)
    private readonly sessionRepo: ISessionRepository,

    @Inject(INJECTION_TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,

    @Inject(INJECTION_TOKENS.DEVICE_REPOSITORY)
    private readonly deviceRepo: IDeviceRepository,

    @Inject(INJECTION_TOKENS.LOGIN_AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: ILoginAuditLogRepository,

    @Inject(INJECTION_TOKENS.RBAC_SERVICE)
    private readonly rbacService: IRbacService,

    @Inject(INJECTION_TOKENS.PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher & PasswordHasherService,

    @Inject(INJECTION_TOKENS.TOKEN_SERVICE)
    private readonly tokenService: ITokenService,

    @Optional()
    private readonly configService?: ConfigService,

    @Optional()
    @Inject(INJECTION_TOKENS.OTP_SERVICE)
    private readonly otpService?: IOtpService,

    // Optional để unit test cũ khởi tạo AuthService vị trí (12 tham số) không đổi hành vi.
    @Optional()
    private readonly mfaService?: MfaService,

    @Optional()
    private readonly sessionRevocation?: SessionRevocationService,
  ) {
    super();
  }

  /**
   * Lay base URL front-end (CLIENT_URL) de dung link magic-link / verify-email.
   * Fail-fast neu thieu (khong fallback localhost - AGENTS 5.4). Neu client gui
   * `redirectUrl` thi BAT BUOC cung origin voi CLIENT_URL de chan open-redirect.
   */
  private resolveClientBaseUrl(redirectUrl?: string): string {
    const base = this.configService?.get<string>('app.clientUrl');
    if (!base) {
      throw new Error('Thiếu câu hình bắt buộc CLIENT_URL (app.clientUrl) - không dùng giá trị mặc định.');
    }
    if (!redirectUrl) {
      return base.replace(/\/$/, '');
    }
    let allowedOrigin: string;
    let redirectOrigin: string;
    try {
      allowedOrigin = new URL(base).origin;
      redirectOrigin = new URL(redirectUrl).origin;
    } catch {
      throw new Error('redirectUrl khong hop le.');
    }
    if (allowedOrigin !== redirectOrigin) {
      throw new Error('redirectUrl phai cung origin voi CLIENT_URL.');
    }
    return redirectUrl.replace(/\/$/, '');
  }

  getEnabledMethods(): string[] {
    const configured = this.configService?.get<string[]>('auth.enabledMethods');
    if (configured && Array.isArray(configured) && configured.length > 0) {
      return configured;
    }
    return [
      AUTH_METHODS.PASSWORD,
      AUTH_METHODS.EMAIL_OTP,
      AUTH_METHODS.PHONE_OTP,
      AUTH_METHODS.MAGIC_LINK,
      AUTH_METHODS.GOOGLE,
      AUTH_METHODS.GITHUB,
      AUTH_METHODS.PASSKEY,
    ];
  }

  protected assertMethodEnabled(method: string): void {
    const enabled = this.getEnabledMethods();
    if (enabled.includes('*') || enabled.includes(method.toLowerCase())) {
      return;
    }
    throw new AuthMethodDisabledException(method);
  }

  async signUp(dto: SignupDto, context?: ClientContext): Promise<AuthResponseDto> {
    this.assertMethodEnabled(AUTH_METHODS.PASSWORD);
    const email = dto.email ? this.normalizeEmail(dto.email) : '';
    const username = dto.username?.trim().toLowerCase() || '';
    if (!email && !username) {
      throw new BadRequestException('Email hoặc tên đăng nhập là bắt buộc');
    }
    if (email && username) {
      throw new BadRequestException('Chỉ được cung cấp email hoặc tên đăng nhập, không cung cấp cả hai');
    }
    this.logAction('SIGNUP_ATTEMPT', email || username, context);

    if (email && (await this.emailRepo.findByEmail(email))) {
      throw new EmailAlreadyExistsException(email);
    }
    if (username && (await this.userRepo.findByUsername(username))) {
      throw new BadRequestException('Tên đăng nhập đã tồn tại');
    }

    const userId = uuidv7();

    // Tối ưu: provider và user độc lập -> tạo song song
    const [provider, user] = await Promise.all([
      this.providerRepo.findOrCreate(
        SYSTEM_PROVIDER.LOCAL,
        'password',
        'Local Password Authentication',
      ),
      this.userRepo.create({
        id: userId,
        userName: dto.userName?.trim() || username || email.split('@')[0] || 'User',
        username: username || null,
        locale: dto.locale || 'vi',
        timezone: dto.timezone || 'Asia/Ho_Chi_Minh',
        status: 'active',
        lastLoginAt: new Date(),
      }),
    ]);

    // Identity phụ thuộc provider.id + user.id
    const identity = await this.identityRepo.create({
      id: uuidv7(),
      userId: user.id,
      providerId: provider.id,
      providerUserId: username || email,
      email: email || null,
      emailVerified: email ? false : null,
      lastLoginAt: new Date(),
    });

    // Tối ưu: các thao tác không phụ thuộc nhau -> chạy song song
    const passwordHash = await this.passwordHasher.hash(dto.password);
    const [, , accessControl, device] = await Promise.all([
      email
        ? this.emailRepo.create({
            id: uuidv7(),
            userId: user.id,
            email,
            isPrimary: true,
            verifiedAt: null,
          })
        : Promise.resolve(null),
      this.passwordRepo.create({
        identityId: identity.id,
        passwordHash,
        hashAlgorithm: this.passwordHasher.algorithm,
        passwordChangedAt: new Date(),
        mustChange: false,
        failedAttempts: 0,
        lockedUntil: null,
      }),
      this.rbacService.assignDefaultAccess(user.id),
      this.deviceRepo.findOrCreate(user.id, context?.userAgent, context?.deviceName),
    ]);

    // Email Verification (best-effort): không chặn luồng đăng ký nếu gửi mail thất bại
    const emailVerificationEnabled =
      this.configService?.get<boolean>('auth.emailVerificationEnabled', false) ?? false;
    if (email && emailVerificationEnabled && this.otpService) {
      const clientBaseUrl = this.resolveClientBaseUrl();
      this.otpService
        .sendVerificationEmail(email, user.id, clientBaseUrl, context?.ip)
        .catch((err: Error) => {
          this.logger.warn(`Gửi email xác minh cho [${email}] thất bại: ${err.message}`);
        });
    }

    const sessionId = uuidv7();
    await this.sessionRepo.create({
      id: sessionId,
      userId: user.id,
      identityId: identity.id,
      deviceId: device.id,
      ip: context?.ip,
      userAgent: context?.userAgent,
    });

    const tokens = await this.tokenService.generateTokenPair(
      {
        sub: user.id,
        email: email || user.emails?.find((entry) => entry.isPrimary)?.email || '',
        userName: user.userName,
        sessionId,
        roles: accessControl.roles,
        permissions: accessControl.permissions,
      },
      sessionId,
    );

    const tokenHash = this.tokenService.hashRefreshToken(tokens.refreshToken);
    await Promise.all([
      this.refreshTokenRepo.create({
        id: uuidv7(),
        sessionId,
        parentId: null,
        tokenHash,
      }),
      this.auditRepo.record({
        userId: user.id,
        identityId: identity.id,
        providerId: provider.id,
        eventType: 'auth.signup.success',
        success: true,
        ip: context?.ip,
        userAgent: context?.userAgent,
      }),
    ]);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
      user: {
        id: user.id,
        email: email || null,
        userName: user.userName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        roles: accessControl.roles,
        permissions: accessControl.permissions,
      },
    };
  }

  async signIn(dto: SigninDto, context?: ClientContext): Promise<AuthResponseDto> {
    this.assertMethodEnabled(AUTH_METHODS.PASSWORD);
    const identifier = (dto.identifier || dto.email || '').trim().toLowerCase();
    const isEmail = identifier.includes('@');
    const email = isEmail ? this.normalizeEmail(identifier) : '';
    this.logAction('SIGNIN_ATTEMPT', identifier, context);

    const emailRecord = isEmail ? await this.emailRepo.findByEmail(email) : null;
    const user = emailRecord?.user || (!isEmail ? await this.userRepo.findByUsername(identifier) : null);
    if (!user) {
      await this.recordAuditFailure(null, null, 'auth.signin.failed', context, {
        reason: isEmail ? 'email_not_found' : 'username_not_found',
      });
      throw new InvalidCredentialsException();
    }

    if (user.status !== 'active') {
      throw new AccountDisabledException();
    }

    const provider = await this.providerRepo.findByCode(SYSTEM_PROVIDER.LOCAL);
    if (!provider) {
      throw new InvalidCredentialsException('Phương thức xác thực mật khẩu chưa được kích hoạt');
    }

    const identity = await this.identityRepo.findByProviderAndSubject(provider.id, identifier);
    if (!identity) {
      await this.recordAuditFailure(user.id, null, 'auth.signin.failed', context, {
        reason: 'identity_not_found',
      });
      throw new InvalidCredentialsException();
    }

    const credential = await this.passwordRepo.findByIdentityId(identity.id);
    if (!credential) {
      throw new InvalidCredentialsException('Tài khoản chưa thiết lập mật khẩu');
    }

    if (credential.lockedUntil && new Date(credential.lockedUntil) > new Date()) {
      const minutesRemaining = Math.ceil(
        (new Date(credential.lockedUntil).getTime() - Date.now()) / (60 * 1000),
      );
      throw new AccountLockedException(minutesRemaining);
    }

    const isPasswordValid = await this.passwordHasher.verify(
      dto.password,
      credential.passwordHash,
      credential.hashAlgorithm,
    );

    if (!isPasswordValid) {
      const lockResult = await this.passwordRepo.recordFailedAttempt(identity.id, 5, 15);
      await this.recordAuditFailure(user.id, identity.id, 'auth.signin.failed', context, {
        failedAttempts: lockResult.failedAttempts,
        isLocked: lockResult.isLocked,
      });

      if (lockResult.isLocked) {
        throw new AccountLockedException(15);
      }

      throw new InvalidCredentialsException();
    }

    await this.passwordRepo.resetFailedAttempts(identity.id);

    // S2: tài khoản đã bật TOTP thì BẮT BUỘC mã 6 số mới được phát hành phiên (enforce MFA).
    // Verify TRƯỚC khi tạo session/token — từ chối sớm, không có "phiên nửa vời".
    if (this.mfaService && (await this.mfaService.isTotpEnabled(user.id))) {
      if (!dto.otp) {
        await this.recordAuditFailure(user.id, identity.id, 'auth.signin.mfa_required', context);
        throw new MfaRequiredException();
      }
      try {
        await this.mfaService.verifyTotp(user.id, dto.otp);
      } catch {
        await this.recordAuditFailure(user.id, identity.id, 'auth.signin.mfa_failed', context);
        throw new MfaInvalidException();
      }
    }

    // Tối ưu: các thao tác sau khi xác thực mật khẩu thành công độc lập với nhau
    const rehashPromise = this.passwordHasher.needsRehash(credential.passwordHash, credential.hashAlgorithm)
      ? (async (): Promise<void> => {
          this.logger.log(`Tự động nâng cấp hash mật khẩu cho user ${identifier} sang [${this.passwordHasher.algorithm}]`);
          const newHash = await this.passwordHasher.hash(dto.password);
          await this.passwordRepo.updatePassword(identity.id, newHash, this.passwordHasher.algorithm);
        })()
      : Promise.resolve();

    const [, , accessControl, device] = await Promise.all([
      this.userRepo.updateLastLogin(user.id),
      this.identityRepo.updateLastLogin(identity.id),
      this.rbacService.getUserAccess(user.id),
      this.deviceRepo.findOrCreate(user.id, context?.userAgent, context?.deviceName),
      rehashPromise,
    ]);

    const sessionId = uuidv7();
    await this.sessionRepo.create({
      id: sessionId,
      userId: user.id,
      identityId: identity.id,
      deviceId: device.id,
      ip: context?.ip,
      userAgent: context?.userAgent,
    });

    const tokens = await this.tokenService.generateTokenPair(
      {
        sub: user.id,
        email,
        userName: user.userName,
        sessionId,
        roles: accessControl.roles,
        permissions: accessControl.permissions,
      },
      sessionId,
    );

    const tokenHash = this.tokenService.hashRefreshToken(tokens.refreshToken);
    await Promise.all([
      this.refreshTokenRepo.create({
        id: uuidv7(),
        sessionId,
        parentId: null,
        tokenHash,
      }),
      this.auditRepo.record({
        userId: user.id,
        identityId: identity.id,
        providerId: provider.id,
        eventType: 'auth.signin.success',
        success: true,
        ip: context?.ip,
        userAgent: context?.userAgent,
      }),
    ]);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
      user: {
        id: user.id,
        email,
        userName: user.userName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        roles: accessControl.roles,
        permissions: accessControl.permissions,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto, context?: ClientContext): Promise<AuthResponseDto> {
    const rawToken = dto.refreshToken?.trim();
    if (!rawToken) {
      throw new TokenInvalidException('Refresh token không được để trống');
    }

    const tokenHash = this.tokenService.hashRefreshToken(rawToken);
    const tokenRecord = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!tokenRecord) {
      throw new TokenInvalidException('Refresh token không tồn tại hoặc không hợp lệ');
    }

    if (tokenRecord.revokedAt) {
      throw new TokenInvalidException('Refresh token đã bị thu hồi');
    }

    // Token Reuse Detection
    if (tokenRecord.usedAt) {
      this.logger.error(
        `[SECURITY WARNING] Phát hiện token tái sử dụng (Session: ${tokenRecord.sessionId}). Tiến hành thu hồi toàn bộ phiên!`,
      );
      await this.refreshTokenRepo.revokeSessionChain(tokenRecord.sessionId);
      await this.sessionRepo.revoke(tokenRecord.sessionId);
      // S4: deny-list để access token của phiên bị đe dọa bị từ chối ngay.
      await this.sessionRevocation?.markRevoked(tokenRecord.sessionId);

      await this.auditRepo.record({
        eventType: 'auth.token.reuse_detected',
        success: false,
        ip: context?.ip,
        userAgent: context?.userAgent,
        metadata: { sessionId: tokenRecord.sessionId },
      });

      throw new TokenReusedException();
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      throw new TokenExpiredException('Refresh token đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const session = await this.sessionRepo.findActiveById(tokenRecord.sessionId);
    if (!session) {
      throw new TokenInvalidException('Phiên đăng nhập đã hết hạn hoặc bị hủy bỏ');
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user || user.status !== 'active') {
      throw new AccountDisabledException();
    }

    const primaryEmailRecord = user.emails?.find((e) => e.isPrimary) || user.emails?.[0];
    const email = primaryEmailRecord?.email || '';
    if (!email) {
      this.logger.warn(`User [${user.id}] được refresh token nhưng không có email nào trong user_emails`);
    }

    // Lấy thông tin quyền mới nhất
    const accessControl = await this.rbacService.getUserAccess(user.id);

    await this.refreshTokenRepo.markAsUsed(tokenRecord.id);

    const newTokens = await this.tokenService.generateTokenPair(
      {
        sub: user.id,
        email,
        userName: user.userName,
        sessionId: session.id,
        roles: accessControl.roles,
        permissions: accessControl.permissions,
      },
      session.id,
    );

    const newTokenHash = this.tokenService.hashRefreshToken(newTokens.refreshToken);
    await this.refreshTokenRepo.create({
      id: uuidv7(),
      sessionId: session.id,
      parentId: tokenRecord.id,
      tokenHash: newTokenHash,
    });

    await this.sessionRepo.updateLastSeen(session.id);

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: newTokens.expiresIn,
      tokenType: newTokens.tokenType,
      user: {
        id: user.id,
        email,
        userName: user.userName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        roles: accessControl.roles,
        permissions: accessControl.permissions,
      },
    };
  }

  async signOut(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (session && session.userId === userId) {
      await this.sessionRepo.revoke(sessionId);
      await this.refreshTokenRepo.revokeSessionChain(sessionId);
      // S4: thu hồi access token đang bay của phiên này ngay lập tức.
      await this.sessionRevocation?.markRevoked(sessionId);
      this.logger.log(`User [${userId}] đã đăng xuất khỏi phiên [${sessionId}]`);
    }
  }

  async signOutAll(userId: string): Promise<void> {
    // Lấy danh sách trước để deny-list từng access token (S4) và revoke chuỗi refresh (S1-consistency).
    const activeSessions = await this.sessionRepo.findActiveSessionsByUserId(userId);
    await this.sessionRepo.revokeAllForUser(userId);
    await Promise.all(
      activeSessions.map(async (s) => {
        await this.refreshTokenRepo.revokeSessionChain(s.id);
        await this.sessionRevocation?.markRevoked(s.id);
      }),
    );
    this.logger.log(`User [${userId}] đã đăng xuất toàn bộ phiên trên mọi thiết bị`);
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const accessControl = await this.rbacService.getUserAccess(userId);

    return {
      id: user.id,
      userName: user.userName,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      timezone: user.timezone,
      status: user.status,
      roles: accessControl.roles,
      permissions: accessControl.permissions,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      emails: (user.emails || []).map((e) => ({
        id: e.id,
        email: e.email,
        isPrimary: e.isPrimary,
        verifiedAt: e.verifiedAt,
      })),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto, currentSessionId?: string): Promise<void> {
    if (dto.currentPassword === dto.newPassword) {
      throw new PasswordSameAsCurrentException();
    }

    const provider = await this.providerRepo.findByCode(SYSTEM_PROVIDER.LOCAL);
    if (!provider) {
      throw new BadRequestException('Không tìm thấy nhà cung cấp xác thực');
    }

    const identities = await this.identityRepo.findByUserId(userId);
    const localIdentity = identities.find((i) => i.providerId === provider.id);

    if (!localIdentity) {
      throw new BadRequestException('Tài khoản này chưa liên kết phương thức đăng nhập bằng mật khẩu');
    }

    const credential = await this.passwordRepo.findByIdentityId(localIdentity.id);
    if (!credential) {
      throw new BadRequestException('Chưa có thông tin mật khẩu cũ để thay đổi');
    }

    const isCurrentValid = await this.passwordHasher.verify(
      dto.currentPassword,
      credential.passwordHash,
      credential.hashAlgorithm,
    );

    if (!isCurrentValid) {
      throw new InvalidCredentialsException('Mật khẩu hiện tại không chính xác');
    }

    const newHash = await this.passwordHasher.hash(dto.newPassword);
    await this.passwordRepo.updatePassword(
      localIdentity.id,
      newHash,
      this.passwordHasher.algorithm,
    );

    // S1: đổi mật khẩu = nghi ngờ rò rỉ tài khoản -> thu hồi MỌI phiên khác (giữ phiên hiện tại),
    // revoke cả chuỗi refresh token và deny-list access token đang bay của các phiên đó.
    const otherSessions = (await this.sessionRepo.findActiveSessionsByUserId(userId)).filter(
      (s) => s.id !== currentSessionId,
    );
    await this.sessionRepo.revokeAllForUser(userId, currentSessionId);
    await Promise.all(
      otherSessions.map(async (s) => {
        await this.refreshTokenRepo.revokeSessionChain(s.id);
        await this.sessionRevocation?.markRevoked(s.id);
      }),
    );

    await this.auditRepo.record({
      userId,
      identityId: localIdentity.id,
      eventType: 'auth.password.changed',
      success: true,
      metadata: { revokedOtherSessions: otherSessions.length },
    });

    this.logger.log(`User [${userId}] đã đổi mật khẩu thành công (đã thu hồi ${otherSessions.length} phiên khác)`);
  }

  async getActiveSessions(userId: string, currentSessionId?: string): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepo.findActiveSessionsByUserId(userId);
    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      ip: s.ip,
      userAgent: s.userAgent,
      deviceName: null,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      expiresAt: s.expiresAt,
      isCurrent: currentSessionId ? s.id === currentSessionId : false,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Không tìm thấy phiên đăng nhập hoặc phiên không thuộc tài khoản của bạn');
    }
    await this.sessionRepo.revoke(sessionId);
    await this.refreshTokenRepo.revokeSessionChain(sessionId);
    await this.sessionRevocation?.markRevoked(sessionId);
    this.logger.log(`User [${userId}] đã thu hồi thủ công phiên [${sessionId}]`);
  }

  async getAuditLogs(
    userId: string,
    query: QueryAuditLogsDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>> {
    const { items, total } = await this.auditRepo.findByUserId(userId, {
      page: query.page,
      limit: query.limit,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const dtos: AuditLogResponseDto[] = items.map((log) => ({
      id: log.id,
      userId: log.userId,
      eventType: log.eventType,
      success: log.success,
      ip: log.ip,
      userAgent: log.userAgent,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));

    return new PaginatedResult<AuditLogResponseDto>(
      dtos,
      total,
      query.page || 1,
      query.limit || 10,
    );
  }

  private getOtpService(): IOtpService {
    if (!this.otpService) {
      throw new BadRequestException('Dịch vụ xác thực OTP/Token chưa được cấu hình');
    }
    return this.otpService;
  }

  async sendOtp(
    dto: SendOtpDto,
    context?: ClientContext,
  ): Promise<{ success: boolean; message: string }> {
    const channel = dto.channel || 'email';
    const method = channel === 'sms' ? AUTH_METHODS.PHONE_OTP : AUTH_METHODS.EMAIL_OTP;
    this.assertMethodEnabled(method);

    const target = channel === 'email' ? this.normalizeEmail(dto.target) : dto.target.trim();
    const result = await this.getOtpService().sendOtp(
      target,
      channel,
      dto.purpose || 'login',
      context?.ip,
    );

    await this.auditRepo.record({
      userId: null,
      identityId: null,
      eventType: 'auth.otp.sent',
      success: true,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { target, channel, purpose: dto.purpose, expiresInSeconds: result.expiresInSeconds },
    });

    return {
      success: true,
      message: `Mã xác thực OTP đã được gửi tới ${target} qua ${channel.toUpperCase()}`,
    };
  }

  async verifyOtp(dto: VerifyOtpDto, context?: ClientContext): Promise<AuthResponseDto> {
    const isEmail = dto.target.includes('@');
    const method = isEmail ? AUTH_METHODS.EMAIL_OTP : AUTH_METHODS.PHONE_OTP;
    this.assertMethodEnabled(method);

    const target = isEmail ? this.normalizeEmail(dto.target) : dto.target.trim();
    await this.getOtpService().verifyOtp(target, dto.otp, dto.purpose || 'login');

    if (isEmail) {
      const emailRecord = await this.emailRepo.findByEmail(target);
      let user: UserEntity;
      let identity: UserIdentity;

      const provider = await this.providerRepo.findOrCreate(
        AUTH_METHODS.EMAIL_OTP,
        'otp',
        'Email OTP Authentication Provider',
      );

      if (!emailRecord) {
        const userId = uuidv7();
        user = await this.userRepo.create({
          id: userId,
          userName: dto.displayName?.trim() || target.split('@')[0],
          locale: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
          status: 'active',
          lastLoginAt: new Date(),
        });

        await this.emailRepo.create({
          id: uuidv7(),
          userId: user.id,
          email: target,
          isPrimary: true,
          verifiedAt: new Date(),
        });

        identity = await this.identityRepo.create({
          id: uuidv7(),
          userId: user.id,
          providerId: provider.id,
          providerUserId: target,
          email: target,
          emailVerified: true,
          lastLoginAt: new Date(),
        });

        const accessControl = await this.rbacService.assignDefaultAccess(user.id);
        return this.issueSessionAndTokens(
          user,
          identity,
          target,
          context,
          'auth.otp.signup.success',
          accessControl,
        );
      } else {
        if (!emailRecord.user) {
          this.logger.error(
            `[DATA INTEGRITY] Bản ghi email [${target}] tồn tại nhưng không liên kết được user (emailRecord.user = null)`,
          );
          throw new NotFoundException('Không tìm thấy tài khoản người dùng tương ứng');
        }
        user = emailRecord.user;
        if (user.status !== 'active') {
          throw new AccountDisabledException();
        }

        if (!emailRecord.verifiedAt) {
          await this.emailRepo.markAsVerified(emailRecord.id);
        }

        let existingIdentity = await this.identityRepo.findByProviderAndSubject(
          provider.id,
          target,
        );
        if (!existingIdentity) {
          existingIdentity = await this.identityRepo.create({
            id: uuidv7(),
            userId: user.id,
            providerId: provider.id,
            providerUserId: target,
            email: target,
            emailVerified: true,
            lastLoginAt: new Date(),
          });
        }

        await this.userRepo.updateLastLogin(user.id);
        await this.identityRepo.updateLastLogin(existingIdentity.id);
        const accessControl = await this.rbacService.getUserAccess(user.id);
        return this.issueSessionAndTokens(
          user,
          existingIdentity,
          target,
          context,
          'auth.otp.signin.success',
          accessControl,
        );
      }
    } else {
      const provider = await this.providerRepo.findOrCreate(
        AUTH_METHODS.PHONE_OTP,
        'sms',
        'Phone SMS OTP Authentication Provider',
      );

      const identity = await this.identityRepo.findByProviderAndSubject(provider.id, target);
      let user: UserEntity;

      if (!identity) {
        const userId = uuidv7();
        user = await this.userRepo.create({
          id: userId,
          userName: dto.displayName?.trim() || `Phone_${target.slice(-4)}`,
          locale: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
          status: 'active',
          lastLoginAt: new Date(),
        });

        const newIdentity = await this.identityRepo.create({
          id: uuidv7(),
          userId: user.id,
          providerId: provider.id,
          providerUserId: target,
          email: null,
          emailVerified: false,
          lastLoginAt: new Date(),
        });

        const accessControl = await this.rbacService.assignDefaultAccess(user.id);
        return this.issueSessionAndTokens(
          user,
          newIdentity,
          `${target}@phone.agentcloud.local`,
          context,
          'auth.phone_otp.signup.success',
          accessControl,
        );
      } else {
        const foundUser = await this.userRepo.findById(identity.userId);
        if (!foundUser) {
          throw new NotFoundException('Không tìm thấy tài khoản người dùng tương ứng');
        }
        user = foundUser;
        if (user.status !== 'active') {
          throw new AccountDisabledException();
        }

        await this.userRepo.updateLastLogin(user.id);
        await this.identityRepo.updateLastLogin(identity.id);
        const accessControl = await this.rbacService.getUserAccess(user.id);
        const email = identity.email || `${target}@phone.agentcloud.local`;
        return this.issueSessionAndTokens(
          user,
          identity,
          email,
          context,
          'auth.phone_otp.signin.success',
          accessControl,
        );
      }
    }
  }

  async sendMagicLink(
    dto: SendMagicLinkDto,
    context?: ClientContext,
  ): Promise<{ success: boolean; message: string }> {
    this.assertMethodEnabled(AUTH_METHODS.MAGIC_LINK);

    const email = this.normalizeEmail(dto.email);
    const clientBaseUrl = this.resolveClientBaseUrl(dto.redirectUrl);
    const result = await this.getOtpService().sendMagicLink(email, clientBaseUrl, context?.ip);

    await this.auditRepo.record({
      userId: null,
      identityId: null,
      eventType: 'auth.magic_link.sent',
      success: true,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { email, clientBaseUrl, expiresInSeconds: result.expiresInSeconds },
    });

    return {
      success: true,
      message: `Đường dẫn đăng nhập nhanh (Magic Link) đã được gửi tới ${email}`,
    };
  }

  async verifyMagicLink(
    dto: VerifyMagicLinkDto,
    context?: ClientContext,
  ): Promise<AuthResponseDto> {
    this.assertMethodEnabled(AUTH_METHODS.MAGIC_LINK);

    const result = await this.getOtpService().verifyMagicLink(dto.token);
    const email = this.normalizeEmail(result.email);

    const emailRecord = await this.emailRepo.findByEmail(email);
    let user: UserEntity;
    let identity: UserIdentity;

    const provider = await this.providerRepo.findOrCreate(
      AUTH_METHODS.MAGIC_LINK,
      'magic_link',
      'Magic Link Passwordless Authentication Provider',
    );

    if (!emailRecord) {
      const userId = uuidv7();
      user = await this.userRepo.create({
        id: userId,
        userName: email.split('@')[0],
        locale: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        status: 'active',
        lastLoginAt: new Date(),
      });

      await this.emailRepo.create({
        id: uuidv7(),
        userId: user.id,
        email,
        isPrimary: true,
        verifiedAt: new Date(),
      });

      identity = await this.identityRepo.create({
        id: uuidv7(),
        userId: user.id,
        providerId: provider.id,
        providerUserId: email,
        email,
        emailVerified: true,
        lastLoginAt: new Date(),
      });

      const accessControl = await this.rbacService.assignDefaultAccess(user.id);
      return this.issueSessionAndTokens(
        user,
        identity,
        email,
        context,
        'auth.magic_link.signup.success',
        accessControl,
      );
    } else {
      if (!emailRecord.user) {
        this.logger.error(
          `[DATA INTEGRITY] Bản ghi email [${email}] tồn tại nhưng không liên kết được user (emailRecord.user = null)`,
        );
        throw new NotFoundException('Không tìm thấy tài khoản người dùng tương ứng');
      }
      user = emailRecord.user;
      if (user.status !== 'active') {
        throw new AccountDisabledException();
      }

      if (!emailRecord.verifiedAt) {
        await this.emailRepo.markAsVerified(emailRecord.id);
      }

      let existingIdentity = await this.identityRepo.findByProviderAndSubject(
        provider.id,
        email,
      );
      if (!existingIdentity) {
        existingIdentity = await this.identityRepo.create({
          id: uuidv7(),
          userId: user.id,
          providerId: provider.id,
          providerUserId: email,
          email,
          emailVerified: true,
          lastLoginAt: new Date(),
        });
      }

      await this.userRepo.updateLastLogin(user.id);
      await this.identityRepo.updateLastLogin(existingIdentity.id);
      const accessControl = await this.rbacService.getUserAccess(user.id);
      return this.issueSessionAndTokens(
        user,
        existingIdentity,
        email,
        context,
        'auth.magic_link.signin.success',
        accessControl,
      );
    }
  }

  async linkIdentity(
    userId: string,
    dto: LinkIdentityDto,
    context?: ClientContext,
  ): Promise<{ success: boolean; message: string }> {
    const providerCode = dto.provider.trim().toLowerCase();
    this.assertMethodEnabled(providerCode);

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng để liên kết');
    }

    const provider = await this.providerRepo.findOrCreate(
      providerCode,
      'oauth',
      `${dto.provider} Identity Provider`,
    );

    const existingIdentity = await this.identityRepo.findByProviderAndSubject(
      provider.id,
      dto.providerUserId.trim(),
    );

    if (existingIdentity) {
      if (existingIdentity.userId === userId) {
        return {
          success: true,
          message: `Phương thức ${providerCode} đã được liên kết với tài khoản này từ trước`,
        };
      }
      throw new IdentityAlreadyLinkedException(providerCode, dto.providerUserId);
    }

    await this.identityRepo.create({
      id: uuidv7(),
      userId: user.id,
      providerId: provider.id,
      providerUserId: dto.providerUserId.trim(),
      email: dto.email ? this.normalizeEmail(dto.email) : null,
      emailVerified: !!dto.email,
      profile: dto.profile || {},
      lastLoginAt: new Date(),
    });

    await this.auditRepo.record({
      userId: user.id,
      identityId: null,
      providerId: provider.id,
      eventType: 'auth.identity.linked',
      success: true,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: {
        provider: providerCode,
        providerUserId: dto.providerUserId,
        email: dto.email,
      },
    });

    this.logger.log(`User [${userId}] đã liên kết thành công phương thức [${providerCode}]`);
    return {
      success: true,
      message: `Liên kết phương thức ${providerCode} vào tài khoản thành công`,
    };
  }

  /**
   * Gửi (hoặc gửi lại) email xác minh cho email primary của người dùng đã đăng nhập.
   */
  async sendEmailVerification(
    userId: string,
    context?: ClientContext,
  ): Promise<{ success: boolean; message: string }> {
    const emails = await this.emailRepo.findByUserId(userId);
    const primaryEmail = emails.find((e) => e.isPrimary) || emails[0];

    if (!primaryEmail) {
      throw new NotFoundException('Không tìm thấy email nào thuộc tài khoản này');
    }
    if (primaryEmail.verifiedAt) {
      return {
        success: true,
        message: `Email ${primaryEmail.email} đã được xác minh từ trước`,
      };
    }

    const clientBaseUrl = this.resolveClientBaseUrl();
    await this.getOtpService().sendVerificationEmail(primaryEmail.email, userId, clientBaseUrl, context?.ip);

    await this.auditRepo.record({
      userId,
      identityId: null,
      eventType: 'auth.email_verification.sent',
      success: true,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { email: primaryEmail.email },
    });

    return {
      success: true,
      message: `Đã gửi email xác minh tới ${primaryEmail.email}`,
    };
  }

  /**
   * Xác thực token xác minh email -> đánh dấu email đã xác minh.
   */
  async verifyEmailToken(
    token: string,
    context?: ClientContext,
  ): Promise<{ success: boolean; email: string; message: string }> {
    const result = await this.getOtpService().verifyEmailToken(token);
    const email = this.normalizeEmail(result.email);

    const emailRecord = await this.emailRepo.findByEmail(email);
    if (!emailRecord) {
      throw new NotFoundException('Không tìm thấy bản ghi email tương ứng với link xác minh');
    }

    if (!emailRecord.verifiedAt) {
      await this.emailRepo.markAsVerified(emailRecord.id);
    }

    await this.auditRepo.record({
      userId: emailRecord.userId,
      identityId: null,
      eventType: 'auth.email.verified',
      success: true,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { email },
    });

    this.logger.log(`Email [${email}] đã được xác minh thành công`);
    return {
      success: true,
      email,
      message: 'Xác minh email thành công',
    };
  }

  /**
   * Phát hành phiên đăng nhập + cặp token JWT cho một user/identity đã xác thực.
   * Public để các module khác (OAuth, Passkey) tái sử dụng logic cấp phiên thống nhất.
   */
  async issueSessionAndTokens(
    user: UserEntity,
    identity: UserIdentity,
    email: string,
    context: ClientContext | undefined,
    eventType: string,
    accessControl: { roles: string[]; permissions: string[] },
  ): Promise<AuthResponseDto> {
    const device = await this.deviceRepo.findOrCreate(
      user.id,
      context?.userAgent,
      context?.deviceName,
    );

    const sessionId = uuidv7();
    await this.sessionRepo.create({
      id: sessionId,
      userId: user.id,
      identityId: identity.id,
      deviceId: device.id,
      ip: context?.ip,
      userAgent: context?.userAgent,
    });

    const tokens = await this.tokenService.generateTokenPair(
      {
        sub: user.id,
        email,
        userName: user.userName,
        sessionId,
        roles: accessControl.roles,
        permissions: accessControl.permissions,
      },
      sessionId,
    );

    const tokenHash = this.tokenService.hashRefreshToken(tokens.refreshToken);
    await Promise.all([
      this.refreshTokenRepo.create({
        id: uuidv7(),
        sessionId,
        parentId: null,
        tokenHash,
      }),
      this.auditRepo.record({
        userId: user.id,
        identityId: identity.id,
        providerId: identity.providerId,
        eventType,
        success: true,
        ip: context?.ip,
        userAgent: context?.userAgent,
      }),
    ]);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
      user: {
        id: user.id,
        email,
        userName: user.userName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        roles: accessControl.roles,
        permissions: accessControl.permissions,
      },
    };
  }

  private async recordAuditFailure(
    userId: string | null,
    identityId: string | null,
    eventType: string,
    context?: ClientContext,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    await this.auditRepo.record({
      userId,
      identityId,
      eventType,
      success: false,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata,
    });
  }
}
