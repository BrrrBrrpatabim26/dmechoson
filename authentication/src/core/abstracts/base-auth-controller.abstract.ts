import { Logger } from '@nestjs/common';
import type { Request } from 'express';
import { ApiResponse } from '../../common/responses/api-response.dto.js';
import type { ClientContext, IAuthService } from '../interfaces/auth-service.interface.js';
import type { IAuthController } from '../interfaces/auth-controller.interface.js';
import type { TokenPayload } from '../interfaces/token-service.interface.js';
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
 * Lớp trừu tượng BaseAuthController (Template Method & Polymorphic Controller).
 *
 * Cung cấp toàn bộ logic trích xuất ngữ cảnh máy khách, định dạng ApiResponse chuẩn
 * và các triển khai mặc định. Các controller cụ thể theo version (V1, V2...) chỉ cần kế thừa
 * và có thể override bất kỳ endpoint nào để nâng cấp mà không phá vỡ logic cũ.
 */
export abstract class BaseAuthController implements IAuthController {
  protected readonly logger: Logger;

  constructor(protected readonly authService: IAuthService) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Helper trích xuất ngữ cảnh máy khách từ Request.
   *
   * IP lấy qua `req.ip` (Express tự phân giải theo cấu hình `trust proxy`),
   * KHÔNG tự parse `x-forwarded-for` từ header client (chống giả mạo IP - AGENTS 1.2 #9).
   */
  protected getClientContext(req: Request, deviceName?: string): ClientContext {
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = (req.headers['user-agent'] as string) || undefined;
    return { ip, userAgent, deviceName };
  }

  /**
   * Triển khai mặc định xử lý đăng ký tài khoản.
   */
  async signup(dto: SignupDto, req: Request): Promise<ApiResponse<AuthResponseDto>> {
    const context = this.getClientContext(req);
    const result = await this.authService.signUp(dto, context);
    return ApiResponse.ok(result);
  }

  /**
   * Triển khai mặc định xử lý đăng nhập.
   */
  async signin(dto: SigninDto, req: Request): Promise<ApiResponse<AuthResponseDto>> {
    const context = this.getClientContext(req, dto.deviceName);
    const result = await this.authService.signIn(dto, context);
    return ApiResponse.ok(result);
  }

  /**
   * Triển khai mặc định xử lý xoay vòng Refresh Token.
   */
  async refresh(dto: RefreshTokenDto, req: Request): Promise<ApiResponse<AuthResponseDto>> {
    const context = this.getClientContext(req);
    const result = await this.authService.refreshToken(dto, context);
    return ApiResponse.ok(result);
  }

  /**
   * Triển khai mặc định xử lý đăng xuất phiên hiện tại.
   */
  async signout(user: TokenPayload): Promise<ApiResponse<{ message: string }>> {
    if (user.sessionId) {
      await this.authService.signOut(user.sessionId, user.sub);
    }
    return ApiResponse.ok({ message: 'Đăng xuất thành công' });
  }

  /**
   * Triển khai mặc định xử lý đăng xuất toàn bộ thiết bị.
   */
  async signoutAll(userId: string): Promise<ApiResponse<{ message: string }>> {
    await this.authService.signOutAll(userId);
    return ApiResponse.ok({ message: 'Đã đăng xuất khỏi toàn bộ thiết bị' });
  }

  /**
   * Triển khai mặc định lấy thông tin tài khoản.
   */
  async getProfile(userId: string): Promise<ApiResponse<UserProfileDto>> {
    const profile = await this.authService.getProfile(userId);
    return ApiResponse.ok(profile);
  }

  /**
   * Triển khai mặc định đổi mật khẩu.
   * `currentSessionId`: phiên đang thực hiện đổi — được giữ sống; các phiên khác bị thu hồi (S1).
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    currentSessionId?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    await this.authService.changePassword(userId, dto, currentSessionId);
    return ApiResponse.ok({ message: 'Đổi mật khẩu thành công' });
  }

  /**
   * Triển khai mặc định truy vấn danh sách phiên hoạt động của người dùng.
   */
  async getSessions(user: TokenPayload): Promise<ApiResponse<SessionResponseDto[]>> {
    const sessions = await this.authService.getActiveSessions(user.sub, user.sessionId);
    return ApiResponse.ok(sessions);
  }

  /**
   * Triển khai mặc định thu hồi một phiên đăng nhập cụ thể.
   */
  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    await this.authService.revokeSession(userId, sessionId);
    return ApiResponse.ok({ message: 'Thu hồi phiên đăng nhập thành công' });
  }

  /**
   * Triển khai mặc định truy vấn nhật ký đăng nhập kèm phân trang và lọc.
   */
  async getAuditLogs(
    userId: string,
    query: QueryAuditLogsDto,
  ): Promise<ApiResponse<PaginatedResult<AuditLogResponseDto>>> {
    const result = await this.authService.getAuditLogs(userId, query);
    return ApiResponse.ok(result);
  }

  /**
   * Triển khai mặc định lấy danh sách phương thức xác thực được kích hoạt trong hệ thống.
   */
  async getAuthMethods(): Promise<ApiResponse<{ enabledMethods: string[] }>> {
    const enabledMethods = this.authService.getEnabledMethods();
    return ApiResponse.ok({ enabledMethods });
  }

  /**
   * Triển khai mặc định gửi OTP qua Email hoặc SMS.
   */
  async sendOtp(dto: SendOtpDto, req: Request): Promise<ApiResponse<{ message: string }>> {
    const context = this.getClientContext(req);
    const result = await this.authService.sendOtp(dto, context);
    return ApiResponse.ok(result);
  }

  /**
   * Triển khai mặc định xác thực OTP đăng nhập / đăng ký.
   */
  async verifyOtp(dto: VerifyOtpDto, req: Request): Promise<ApiResponse<AuthResponseDto>> {
    const context = this.getClientContext(req, dto.deviceName);
    const result = await this.authService.verifyOtp(dto, context);
    return ApiResponse.ok(result);
  }

  /**
   * Triển khai mặc định gửi Magic Link qua Email.
   */
  async sendMagicLink(
    dto: SendMagicLinkDto,
    req: Request,
  ): Promise<ApiResponse<{ message: string }>> {
    const context = this.getClientContext(req);
    const result = await this.authService.sendMagicLink(dto, context);
    return ApiResponse.ok(result);
  }

  /**
   * Triển khai mặc định xác thực Magic Link đăng nhập.
   */
  async verifyMagicLink(
    dto: VerifyMagicLinkDto,
    req: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const context = this.getClientContext(req, dto.deviceName);
    const result = await this.authService.verifyMagicLink(dto, context);
    return ApiResponse.ok(result);
  }

  /**
   * Triển khai mặc định liên kết phương thức xác thực mới vào tài khoản hiện tại.
   */
  async linkIdentity(
    user: TokenPayload,
    dto: LinkIdentityDto,
    req: Request,
  ): Promise<ApiResponse<{ message: string }>> {
    const context = this.getClientContext(req);
    const result = await this.authService.linkIdentity(user.sub, dto, context);
    return ApiResponse.ok(result);
  }

  /**
   * Triển khai mặc định gửi email xác minh cho tài khoản hiện tại.
   */
  async sendEmailVerification(
    user: TokenPayload,
    req: Request,
  ): Promise<ApiResponse<{ message: string }>> {
    const context = this.getClientContext(req);
    const result = await this.authService.sendEmailVerification(user.sub, context);
    return ApiResponse.ok(result);
  }

  /**
   * Triển khai mặc định xác thực token từ link xác minh email.
   */
  async verifyEmail(
    dto: VerifyEmailDto,
    req: Request,
  ): Promise<ApiResponse<{ message: string; email: string }>> {
    const context = this.getClientContext(req);
    const result = await this.authService.verifyEmailToken(dto.token, context);
    return ApiResponse.ok({ message: result.message, email: result.email });
  }
}

