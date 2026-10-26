import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ApiResponse } from '../../../common/responses/api-response.dto.js';
import { BaseAuthController } from '../../../core/abstracts/base-auth-controller.abstract.js';
import type { IAuthService } from '../../../core/interfaces/auth-service.interface.js';
import type { TokenPayload } from '../../../core/interfaces/token-service.interface.js';
import { INJECTION_TOKENS } from '../../../core/tokens/injection.tokens.js';
import { AuthResponseDto } from '../dto/auth-response.dto.js';
import { SigninDto } from '../dto/signin.dto.js';
import { MfaService } from '../../mfa/mfa.service.js';
import { PasskeyService } from '../../mfa/passkey.service.js';

/**
 * Controller Xác thực Phiên bản 2 (Auth V2 Controller).
 *
 * Minh họa tính đa hình: Kế thừa BaseAuthController và nâng cấp endpoint /signin
 * (ví dụ: bổ sung metadata phiên nâng cao, tích hợp chuẩn bị cho MFA/Passkey)
 * mà không ảnh hưởng bất kỳ client nào đang sử dụng V1!
 *
 * Lắng nghe tại URI: `/api/v2/auth/...`
 */
@ApiTags('Authentication V2 (Phiên bản 2 - Mở rộng đa hình)')
@Controller({ path: 'auth', version: '2' })
export class AuthV2Controller extends BaseAuthController {
  constructor(
    @Inject(INJECTION_TOKENS.AUTH_SERVICE)
    authService: IAuthService,
    private readonly mfaService: MfaService,
    private readonly passkeyService: PasskeyService,
  ) {
    super(authService);
  }

  /**
   * Ví dụ nâng cấp đa hình: Endpoint đăng nhập V2 trả về thông tin bổ sung và định dạng nâng cao.
   */
  @Post('signin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: '[V2] Đăng nhập hệ thống phiên bản nâng cao',
    description: 'Nâng cấp đa hình từ BaseAuthController: Bổ sung telemetry và chuẩn bị xác thực đa yếu tố (MFA).',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập V2 thành công.',
    type: AuthResponseDto,
  })
  override async signin(
    @Body() dto: SigninDto,
    @Req() req: Request,
  ): Promise<ApiResponse<AuthResponseDto>> {
    this.logger.log(`[API V2] Nhận yêu cầu đăng nhập V2 từ client IP: ${req.ip}`);
    // Tận dụng logic cơ sở từ lớp cha (BaseAuthController) và có thể mở rộng
    return super.signin(dto, req);
  }

  /**
   * Endpoint mới độc quyền trên V2: Kiểm tra tính sẵn sàng MFA/Passkey theo trạng thái thực của tài khoản.
   */
  @Get('security-capabilities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer')
  @ApiOperation({
    summary: '[V2] Kiểm tra tính năng bảo mật nâng cao khả dụng',
    description: 'Endpoint mới chỉ có trên API V2. mfaEnabled lấy từ trạng thái factor thực trong DB, passkeySupported phản ánh cấu hình WebAuthn + AUTH_ENABLED_METHODS.',
  })
  async getSecurityCapabilities(
    @CurrentUser() user: TokenPayload,
  ): Promise<
    ApiResponse<{
      mfaEnabled: boolean;
      passkeySupported: boolean;
      activeSessionId: string | null;
    }>
  > {
    const [factors, passkeySupported] = await Promise.all([
      this.mfaService.listFactors(user.sub),
      this.passkeyService.isPasskeySupported(),
    ]);

    return ApiResponse.ok({
      mfaEnabled: factors.factors.length > 0,
      passkeySupported,
      activeSessionId: user.sessionId || null,
    });
  }
}
