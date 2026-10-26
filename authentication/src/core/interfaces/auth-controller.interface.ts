import type { Request } from 'express';
import type { ApiResponse } from '../../common/responses/api-response.dto.js';
import type { TokenPayload } from './token-service.interface.js';
import type { SignupDto } from '../../modules/auth/dto/signup.dto.js';
import type { SigninDto } from '../../modules/auth/dto/signin.dto.js';
import type { RefreshTokenDto } from '../../modules/auth/dto/refresh-token.dto.js';
import type { ChangePasswordDto } from '../../modules/auth/dto/change-password.dto.js';
import type { AuthResponseDto } from '../../modules/auth/dto/auth-response.dto.js';
import type { UserProfileDto } from '../../modules/auth/dto/user-profile.dto.js';

import type { SendOtpDto } from '../../modules/auth/dto/send-otp.dto.js';
import type { VerifyOtpDto } from '../../modules/auth/dto/verify-otp.dto.js';
import type { SendMagicLinkDto } from '../../modules/auth/dto/send-magic-link.dto.js';
import type { VerifyMagicLinkDto } from '../../modules/auth/dto/verify-magic-link.dto.js';
import type { LinkIdentityDto } from '../../modules/auth/dto/link-identity.dto.js';
import type { VerifyEmailDto } from '../../modules/auth/dto/verify-email.dto.js';
import type { SessionResponseDto } from '../../modules/auth/dto/session-response.dto.js';
import type { QueryAuditLogsDto } from '../../modules/auth/dto/query-audit-logs.dto.js';
import type { AuditLogResponseDto } from '../../modules/auth/dto/audit-log-response.dto.js';
import type { PaginatedResult } from '../../common/responses/paginated-response.dto.js';

/**
 * Interface định nghĩa toàn bộ hợp đồng API Controller cho phân hệ Xác thực (Authentication).
 *
 * Mọi Controller theo từng phiên bản (V1, V2, V3...) đều phải tuân thủ hợp đồng này,
 * đảm bảo tính nhất quán và khả năng thay thế đa hình giữa các phiên bản API.
 */
export interface IAuthController {
  signup(dto: SignupDto, req: Request): Promise<ApiResponse<AuthResponseDto>>;

  signin(dto: SigninDto, req: Request): Promise<ApiResponse<AuthResponseDto>>;

  refresh(dto: RefreshTokenDto, req: Request): Promise<ApiResponse<AuthResponseDto>>;

  signout(user: TokenPayload): Promise<ApiResponse<{ message: string }>>;

  signoutAll(userId: string): Promise<ApiResponse<{ message: string }>>;

  getProfile(userId: string): Promise<ApiResponse<UserProfileDto>>;

  changePassword(
    userId: string,
    dto: ChangePasswordDto,
    currentSessionId?: string,
  ): Promise<ApiResponse<{ message: string }>>;

  getSessions(user: TokenPayload): Promise<ApiResponse<SessionResponseDto[]>>;

  revokeSession(userId: string, sessionId: string): Promise<ApiResponse<{ message: string }>>;

  getAuditLogs(
    userId: string,
    query: QueryAuditLogsDto,
  ): Promise<ApiResponse<PaginatedResult<AuditLogResponseDto>>>;

  sendOtp(dto: SendOtpDto, req: Request): Promise<ApiResponse<{ message: string }>>;

  verifyOtp(dto: VerifyOtpDto, req: Request): Promise<ApiResponse<AuthResponseDto>>;

  sendMagicLink(dto: SendMagicLinkDto, req: Request): Promise<ApiResponse<{ message: string }>>;

  verifyMagicLink(dto: VerifyMagicLinkDto, req: Request): Promise<ApiResponse<AuthResponseDto>>;

  linkIdentity(
    user: TokenPayload,
    dto: LinkIdentityDto,
    req: Request,
  ): Promise<ApiResponse<{ message: string }>>;

  sendEmailVerification(user: TokenPayload, req: Request): Promise<ApiResponse<{ message: string }>>;

  verifyEmail(dto: VerifyEmailDto, req: Request): Promise<ApiResponse<{ message: string; email: string }>>;

  getAuthMethods(): Promise<ApiResponse<{ enabledMethods: string[] }>>;
}
