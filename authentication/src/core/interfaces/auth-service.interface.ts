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

export interface ClientContext {
  ip?: string;
  userAgent?: string;
  deviceName?: string;
}

/**
 * Interface nghiệp vụ Authentication Service.
 */
export interface IAuthService {
  signUp(dto: SignupDto, context?: ClientContext): Promise<AuthResponseDto>;
  signIn(dto: SigninDto, context?: ClientContext): Promise<AuthResponseDto>;
  refreshToken(dto: RefreshTokenDto, context?: ClientContext): Promise<AuthResponseDto>;
  signOut(sessionId: string, userId: string): Promise<void>;
  signOutAll(userId: string): Promise<void>;
  getProfile(userId: string): Promise<UserProfileDto>;
  /** `currentSessionId` (nếu có) là phiên đang dùng để đổi mật khẩu — được GIỮ lại; mọi phiên khác bị thu hồi (S1). */
  changePassword(userId: string, dto: ChangePasswordDto, currentSessionId?: string): Promise<void>;
  getActiveSessions(userId: string, currentSessionId?: string): Promise<SessionResponseDto[]>;
  revokeSession(userId: string, sessionId: string): Promise<void>;
  getAuditLogs(
    userId: string,
    query: QueryAuditLogsDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>>;

  // Đa phương thức xác thực (OTP / Magic Link / Account Linking)
  sendOtp(dto: SendOtpDto, context?: ClientContext): Promise<{ success: boolean; message: string }>;
  verifyOtp(dto: VerifyOtpDto, context?: ClientContext): Promise<AuthResponseDto>;
  sendMagicLink(dto: SendMagicLinkDto, context?: ClientContext): Promise<{ success: boolean; message: string }>;
  verifyMagicLink(dto: VerifyMagicLinkDto, context?: ClientContext): Promise<AuthResponseDto>;
  linkIdentity(userId: string, dto: LinkIdentityDto, context?: ClientContext): Promise<{ success: boolean; message: string }>;
  getEnabledMethods(): string[];

  // Xac minh email (Email Verification)
  sendEmailVerification(userId: string, context?: ClientContext): Promise<{ success: boolean; message: string }>;
  verifyEmailToken(token: string, context?: ClientContext): Promise<{ success: boolean; email: string; message: string }>;
}


