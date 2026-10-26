import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { PERMISSION_CODES } from '../../../common/constants/permission-codes.constant.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator.js';
import { RequireRoles } from '../../../common/decorators/require-roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ApiResponse } from '../../../common/responses/api-response.dto.js';
import { BaseAuthController } from '../../../core/abstracts/base-auth-controller.abstract.js';
import type { IAuthService } from '../../../core/interfaces/auth-service.interface.js';
import type { TokenPayload } from '../../../core/interfaces/token-service.interface.js';
import { INJECTION_TOKENS } from '../../../core/tokens/injection.tokens.js';
import { AuthResponseDto } from '../dto/auth-response.dto.js';
import { ChangePasswordDto } from '../dto/change-password.dto.js';
import { RefreshTokenDto } from '../dto/refresh-token.dto.js';
import { SigninDto } from '../dto/signin.dto.js';
import { SignupDto } from '../dto/signup.dto.js';
import { UserProfileDto } from '../dto/user-profile.dto.js';
import { SessionResponseDto } from '../dto/session-response.dto.js';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto.js';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto.js';
import { SendOtpDto } from '../dto/send-otp.dto.js';
import { VerifyOtpDto } from '../dto/verify-otp.dto.js';
import { SendMagicLinkDto } from '../dto/send-magic-link.dto.js';
import { VerifyMagicLinkDto } from '../dto/verify-magic-link.dto.js';
import { LinkIdentityDto } from '../dto/link-identity.dto.js';
import { VerifyEmailDto } from '../dto/verify-email.dto.js';
import { PaginatedResult } from '../../../common/responses/paginated-response.dto.js';

/**
 * Controller Xác thực Phiên bản 1 (Auth V1 Controller).
 *
 * Kế thừa toàn bộ logic đa hình từ BaseAuthController.
 * Lắng nghe tại URI: `/api/v1/auth/...`
 */
@ApiTags('Authentication V1 (Phiên bản 1)')
@Controller({ path: 'auth', version: '1' })
export class AuthV1Controller extends BaseAuthController {
  constructor(
    @Inject(INJECTION_TOKENS.AUTH_SERVICE)
    authService: IAuthService,
  ) {
    super(authService);
  }

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({
    summary: '[V1] Đăng ký tài khoản mới',
    description: 'Tạo tài khoản, gán quyền và vai trò mặc định, băm mật khẩu bảo mật và cấp token.',
  })
  @SwaggerResponse({
    status: HttpStatus.CREATED,
    description: 'Đăng ký thành công.',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({ description: 'Email đã tồn tại.' })
  override async signup(
    @Body() dto: SignupDto,
    @Req() req: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    return super.signup(dto, req);
  }

  @Post('signin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: '[V1] Đăng nhập hệ thống',
    description: 'Xác thực Email/Password, nạp roles & permissions vào JWT payload.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập thành công.',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Sai thông tin hoặc tài khoản bị khóa tạm thời.' })
  override async signin(
    @Body() dto: SigninDto,
    @Req() req: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    return super.signin(dto, req);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[V1] Xoay vòng Refresh Token (Token Rotation)',
    description: 'Đổi Refresh Token cũ lấy cặp token mới. Tự động thu hồi phiên nếu phát hiện tái sử dụng.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Xoay vòng token thành công.',
    type: AuthResponseDto,
  })
  override async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    return super.refresh(dto, req);
  }

  @Post('signout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[V1] Đăng xuất phiên hiện tại',
    description: 'Thu hồi session và refresh token của phiên hiện tại.',
  })
  override async signout(
    @CurrentUser() user: TokenPayload,
  ): Promise<ApiResponse<{ message: string }>> {
    return super.signout(user);
  }

  @Post('signout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[V1] Đăng xuất khỏi toàn bộ thiết bị',
    description: 'Thu hồi tất cả các session của người dùng trên mọi thiết bị.',
  })
  override async signoutAll(
    @CurrentUser('sub') userId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return super.signoutAll(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_CODES.USER_PROFILE_READ)
  @ApiBearerAuth('Bearer')
  @ApiOperation({
    summary: '[V1] Lấy thông tin tài khoản hiện tại',
    description: 'Yêu cầu quyền user:profile:read. Trả về thông tin cá nhân kèm roles và permissions.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin thành công.',
    type: UserProfileDto,
  })
  @ApiForbiddenResponse({ description: 'Không có quyền user:profile:read' })
  override async getProfile(
    @CurrentUser('sub') userId: string,
  ): Promise<ApiResponse<UserProfileDto>> {
    return super.getProfile(userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_CODES.AUTH_CHANGE_PASSWORD)
  @ApiBearerAuth('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[V1] Đổi mật khẩu người dùng',
    description: 'Yêu cầu quyền auth:change-password.',
  })
  @SwaggerResponse({ status: HttpStatus.OK, description: 'Đổi mật khẩu thành công.' })
  @ApiForbiddenResponse({ description: 'Không có quyền đổi mật khẩu' })
  override async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
    @CurrentUser('sessionId') currentSessionId?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    // Truyền sessionId hiện hành để service giữ lại đúng phiên này, thu hồi các phiên còn lại (S1).
    return super.changePassword(userId, dto, currentSessionId);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_CODES.AUTH_SESSION_REVOKE)
  @ApiBearerAuth('Bearer')
  @ApiOperation({
    summary: '[V1] Truy vấn danh sách các phiên đăng nhập đang hoạt động',
    description: 'Yêu cầu quyền auth:session:revoke. Trả về danh sách session chưa hết hạn và chưa bị thu hồi.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách phiên thành công.',
    type: [SessionResponseDto],
  })
  override async getSessions(
    @CurrentUser() user: TokenPayload,
  ): Promise<ApiResponse<SessionResponseDto[]>> {
    return super.getSessions(user);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_CODES.AUTH_SESSION_REVOKE)
  @ApiBearerAuth('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[V1] Thu hồi một phiên đăng nhập cụ thể',
    description: 'Yêu cầu quyền auth:session:revoke. Thu hồi session và toàn bộ refresh token liên quan.',
  })
  @SwaggerResponse({ status: HttpStatus.OK, description: 'Thu hồi phiên thành công.' })
  override async revokeSession(
    @CurrentUser('sub') userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return super.revokeSession(userId, sessionId);
  }

  @Get('audit-logs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSION_CODES.USER_PROFILE_READ)
  @ApiBearerAuth('Bearer')
  @ApiOperation({
    summary: '[V1] Truy vấn nhật ký đăng nhập của người dùng',
    description: 'Yêu cầu quyền user:profile:read. Hỗ trợ phân trang, lọc theo status và sắp xếp.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Lấy nhật ký thành công.',
    type: PaginatedResult<AuditLogResponseDto>,
  })
  override async getAuditLogs(
    @CurrentUser('sub') userId: string,
    @Query() query: QueryAuditLogsDto,
  ): Promise<ApiResponse<PaginatedResult<AuditLogResponseDto>>> {
    return super.getAuditLogs(userId, query);
  }

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @RequireRoles('ADMIN', 'SUPER_ADMIN')
  @RequirePermissions(PERMISSION_CODES.USER_MANAGE)
  @ApiBearerAuth('Bearer')
  @ApiOperation({
    summary: '[V1] Endpoint quản trị mẫu (Yêu cầu Role ADMIN và Quyền user:manage)',
    description: 'Minh họa kiểm tra đồng thời cả Role và Permission.',
  })
  @ApiForbiddenResponse({ description: 'Không có vai trò ADMIN hoặc thiếu quyền user:manage.' })
  async adminDashboard(
    @CurrentUser() user: TokenPayload,
  ): Promise<ApiResponse<{ message: string; user: TokenPayload }>> {
    return ApiResponse.ok({
      message: '[V1] Chào mừng Quản trị viên! Bạn có toàn quyền quản lý người dùng.',
      user,
    });
  }

  @Get('methods')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[V1] Lấy danh sách các phương thức xác thực được hỗ trợ và kích hoạt',
    description: 'Trả về mảng danh sách phương thức (password, email_otp, phone_otp, magic_link, google, github, passkey...)',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách thành công.',
  })
  override async getAuthMethods(): Promise<ApiResponse<{ enabledMethods: string[] }>> {
    return super.getAuthMethods();
  }

  @Post('otp/send')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({
    summary: '[V1] Gửi mã xác thực OTP qua Email hoặc SMS',
    description: 'Sinh mã OTP 6 số ngẫu nhiên cryptographically secure, băm SHA-256 lưu trữ và gửi qua kênh tương ứng.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Mã OTP đã được gửi thành công.',
  })
  override async sendOtp(
    @Body() dto: SendOtpDto,
    @Req() req: Request,
  ): Promise<ApiResponse<{ message: string }>> {
    return super.sendOtp(dto, req);
  }

  @Post('otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: '[V1] Xác thực mã OTP để đăng nhập hoặc đăng ký',
    description: 'Kiểm tra mã OTP bằng hàm so sánh an toàn thời gian. Nếu hợp lệ, tự động tạo mới hoặc liên kết tài khoản và cấp cặp Token JWT.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Xác thực OTP thành công.',
    type: AuthResponseDto,
  })
  override async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    return super.verifyOtp(dto, req);
  }

  @Post('magic-link/send')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({
    summary: '[V1] Gửi đường dẫn đăng nhập nhanh (Magic Link) qua Email',
    description: 'Sinh token 32 bytes ngẫu nhiên, lưu băm SHA-256 và gửi email chứa URL kèm nút đăng nhập 1 chạm.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Đã gửi Magic Link thành công.',
  })
  override async sendMagicLink(
    @Body() dto: SendMagicLinkDto,
    @Req() req: Request,
  ): Promise<ApiResponse<{ message: string }>> {
    return super.sendMagicLink(dto, req);
  }

  @Post('magic-link/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: '[V1] Xác thực Magic Link Token để đăng nhập',
    description: 'Xác thực token từ URL, cấp phiên đăng nhập và Token JWT.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập Magic Link thành công.',
    type: AuthResponseDto,
  })
  override async verifyMagicLink(
    @Body() dto: VerifyMagicLinkDto,
    @Req() req: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    return super.verifyMagicLink(dto, req);
  }

  @Post('identities/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[V1] Liên kết phương thức xác thực mới vào tài khoản hiện tại (Account Linking)',
    description: 'Cho phép người dùng đã đăng nhập liên kết thêm OAuth (Google, GitHub), Số điện thoại hoặc Passkey vào cùng 1 tài khoản (User ID).',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Liên kết thành công.',
  })
  override async linkIdentity(
    @CurrentUser() user: TokenPayload,
    @Body() dto: LinkIdentityDto,
    @Req() req: Request,
  ): Promise<ApiResponse<{ message: string }>> {
    return super.linkIdentity(user, dto, req);
  }

  @Post('email-verification/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({
    summary: '[V1] Gửi (hoặc gửi lại) email xác minh địa chỉ email',
    description: 'Yêu cầu đã đăng nhập. Sinh token 32 bytes (hiệu lực 24 giờ) và gửi tới email primary qua chiến lược Mail đa hình (console/smtp).',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Đã gửi email xác minh (hoặc email đã được xác minh từ trước).',
  })
  override async sendEmailVerification(
    @CurrentUser() user: TokenPayload,
    @Req() req: Request,
  ): Promise<ApiResponse<{ message: string }>> {
    return super.sendEmailVerification(user, req);
  }

  @Post('email-verification/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: '[V1] Xác thực token từ link xác minh email',
    description: 'Public. Kiểm tra hash SHA-256 của token, đánh dấu verifiedAt trên user_emails và hủy token để chống Replay Attack.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Xác minh email thành công.',
  })
  override async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: Request,
  ): Promise<ApiResponse<{ message: string; email: string }>> {
    return super.verifyEmail(dto, req);
  }
}
