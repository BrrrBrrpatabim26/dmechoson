import { Logger } from '@nestjs/common';
import type { ClientContext, IAuthService } from '../interfaces/auth-service.interface.js';
import { SignupDto } from '../../modules/auth/dto/signup.dto.js';
import { SigninDto } from '../../modules/auth/dto/signin.dto.js';
import { RefreshTokenDto } from '../../modules/auth/dto/refresh-token.dto.js';
import { ChangePasswordDto } from '../../modules/auth/dto/change-password.dto.js';
import { AuthResponseDto } from '../../modules/auth/dto/auth-response.dto.js';
import { UserProfileDto } from '../../modules/auth/dto/user-profile.dto.js';
import { SessionResponseDto } from '../../modules/auth/dto/session-response.dto.js';
import { QueryAuditLogsDto } from '../../modules/auth/dto/query-audit-logs.dto.js';
import { AuditLogResponseDto } from '../../modules/auth/dto/audit-log-response.dto.js';
import { SendOtpDto } from '../../modules/auth/dto/send-otp.dto.js';
import { VerifyOtpDto } from '../../modules/auth/dto/verify-otp.dto.js';
import { SendMagicLinkDto } from '../../modules/auth/dto/send-magic-link.dto.js';
import { VerifyMagicLinkDto } from '../../modules/auth/dto/verify-magic-link.dto.js';
import { LinkIdentityDto } from '../../modules/auth/dto/link-identity.dto.js';
import { PaginatedResult } from '../../common/responses/paginated-response.dto.js';

/**
 * Lớp trừu tượng BaseAuthService (Template Method Pattern).
 *
 * Chỉ chứa các phương thức mẫu và logic khung kiểm toán dùng chung.
 */
export abstract class BaseAuthService implements IAuthService {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  abstract signUp(dto: SignupDto, context?: ClientContext): Promise<AuthResponseDto>;
  abstract signIn(dto: SigninDto, context?: ClientContext): Promise<AuthResponseDto>;
  abstract refreshToken(dto: RefreshTokenDto, context?: ClientContext): Promise<AuthResponseDto>;
  abstract signOut(sessionId: string, userId: string): Promise<void>;
  abstract signOutAll(userId: string): Promise<void>;
  abstract getProfile(userId: string): Promise<UserProfileDto>;
  abstract changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
  abstract getActiveSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionResponseDto[]>;
  abstract revokeSession(userId: string, sessionId: string): Promise<void>;
  abstract getAuditLogs(
    userId: string,
    query: QueryAuditLogsDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>>;

  abstract sendOtp(
    dto: SendOtpDto,
    context?: ClientContext,
  ): Promise<{ success: boolean; message: string }>;
  abstract verifyOtp(dto: VerifyOtpDto, context?: ClientContext): Promise<AuthResponseDto>;
  abstract sendMagicLink(
    dto: SendMagicLinkDto,
    context?: ClientContext,
  ): Promise<{ success: boolean; message: string }>;
  abstract verifyMagicLink(
    dto: VerifyMagicLinkDto,
    context?: ClientContext,
  ): Promise<AuthResponseDto>;
  abstract linkIdentity(
    userId: string,
    dto: LinkIdentityDto,
    context?: ClientContext,
  ): Promise<{ success: boolean; message: string }>;
  abstract getEnabledMethods(): string[];

  abstract sendEmailVerification(
    userId: string,
    context?: ClientContext,
  ): Promise<{ success: boolean; message: string }>;
  abstract verifyEmailToken(
    token: string,
    context?: ClientContext,
  ): Promise<{ success: boolean; email: string; message: string }>;


  protected normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  protected logAction(action: string, identifier: string, context?: ClientContext): void {
    const ip = context?.ip || 'unknown-ip';
    const ua = context?.userAgent || 'unknown-agent';
    this.logger.log(`[AUTH-AUDIT] Action: ${action} | Target: ${identifier} | IP: ${ip} | UA: ${ua}`);
  }
}
