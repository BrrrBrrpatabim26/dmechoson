import { Controller, Get, HttpStatus, Req, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { ApiResponse } from '../../common/responses/api-response.dto.js';
import type { ClientContext } from '../../core/interfaces/auth-service.interface.js';
import { AuthResponseDto } from '../auth/dto/auth-response.dto.js';
import { GitHubOAuthGuard } from './guards/github-oauth.guard.js';
import { GoogleOAuthGuard } from './guards/google-oauth.guard.js';
import { OAuthService } from './oauth.service.js';
import type { OAuthProfile } from './interfaces/oauth-profile.interface.js';

/**
 * Controller OAuth 2.0 (Google & GitHub) - phiên bản V1.
 *
 * - `GET /api/v1/auth/google`  : chuyển hướng tới trang consent Google.
 * - `GET /api/v1/auth/google/callback` : nhận code, cấp cặp token JWT.
 * - Tương tự cho GitHub.
 */
@ApiTags('OAuth (Google & GitHub)')
@Controller({ path: 'auth', version: '1' })
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  private getClientContext(req: Request): ClientContext {
    // IP qua req.ip (ton trong `trust proxy`); khong parse x-forwarded-for thu cong (chong spoofing).
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = (req.headers['user-agent'] as string) || undefined;
    return { ip, userAgent };
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: '[OAuth] Khởi động đăng nhập Google (redirect tới consent screen)',
    description: 'Yêu cầu cấu hình GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET. Chưa cấu hình -> AUTH_METHOD_DISABLED.',
  })
  googleLogin(): void {
    // Redirect được thực hiện bởi GoogleOAuthGuard (passport). Handler này không bao giờ chạy.
  }

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @SwaggerResponse({ status: HttpStatus.OK, description: 'Đăng nhập Google thành công.', type: AuthResponseDto })
  @ApiOperation({
    summary: '[OAuth] Callback Google - cấp cặp token JWT',
    description: 'Auto-link theo email đã verify hoặc tạo mới tài khoản, sau đó phát hành session + token.',
  })
  async googleCallback(@Req() req: Request): Promise<ApiResponse<AuthResponseDto>> {
    const profile = req.user as OAuthProfile;
    const result = await this.oauthService.handleProviderLogin(profile, this.getClientContext(req));
    return ApiResponse.ok(result);
  }

  @Get('github')
  @Public()
  @UseGuards(GitHubOAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: '[OAuth] Khởi động đăng nhập GitHub (redirect tới consent screen)',
    description: 'Yêu cầu cấu hình GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET. Chưa cấu hình -> AUTH_METHOD_DISABLED.',
  })
  githubLogin(): void {
    // Redirect được thực hiện bởi GitHubOAuthGuard (passport).
  }

  @Get('github/callback')
  @Public()
  @UseGuards(GitHubOAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @SwaggerResponse({ status: HttpStatus.OK, description: 'Đăng nhập GitHub thành công.', type: AuthResponseDto })
  @ApiOperation({
    summary: '[OAuth] Callback GitHub - cấp cặp token JWT',
    description: 'Auto-link theo email đã verify hoặc tạo mới tài khoản, sau đó phát hành session + token.',
  })
  async githubCallback(@Req() req: Request): Promise<ApiResponse<AuthResponseDto>> {
    const profile = req.user as OAuthProfile;
    const result = await this.oauthService.handleProviderLogin(profile, this.getClientContext(req));
    return ApiResponse.ok(result);
  }
}
