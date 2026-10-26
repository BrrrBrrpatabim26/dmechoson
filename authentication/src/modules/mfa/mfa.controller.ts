import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ApiResponse } from '../../common/responses/api-response.dto.js';
import type { ClientContext } from '../../core/interfaces/auth-service.interface.js';
import type { TokenPayload } from '../../core/interfaces/token-service.interface.js';
import { MfaService } from './mfa.service.js';
import { PasskeyService } from './passkey.service.js';
import { VerifyTotpDto } from './dto/verify-totp.dto.js';
import { VerifyRecoveryCodeDto } from './dto/verify-recovery-code.dto.js';
import { CompletePasskeyRegistrationDto } from './dto/complete-passkey-registration.dto.js';
import {
  CompletePasskeyAuthenticationDto,
  StartPasskeyAuthenticationDto,
} from './dto/passkey-authentication.dto.js';
import { AuthResponseDto } from '../auth/dto/auth-response.dto.js';

/**
 * Controller MFA/TOTP (V1) - yêu cầu đã đăng nhập.
 *
 * Luồng chuẩn: setup -> scan QR -> verify (bật factor + nhận recovery codes).
 */
@ApiTags('MFA / TOTP & Passkey (WebAuthn)')
@Controller({ path: 'auth/mfa', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('Bearer')
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly passkeyService: PasskeyService,
  ) {}

  private static buildClientContext(
    ip?: string,
    userAgent?: string,
    deviceName?: string,
  ): ClientContext {
    return { ip, userAgent, deviceName };
  }

  @Post('totp/setup')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({
    summary: '[MFA] Khởi tạo TOTP (sinh secret + otpauth URL cho QR)',
    description: 'Secret được mã hóa AES-256-GCM trước khi lưu. Factor ở trạng thái chờ cho tới khi verify thành công.',
  })
  async setupTotp(
    @CurrentUser() user: TokenPayload,
  ): Promise<ApiResponse<{ factorId: string; otpauthUrl: string; label: string }>> {
    const result = await this.mfaService.setupTotp(user.sub, user.email || user.sub);
    return ApiResponse.ok({
      factorId: result.factorId,
      otpauthUrl: result.otpauthUrl,
      label: result.label,
    });
  }

  @Post('totp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: '[MFA] Xác minh mã TOTP để bật yếu tố bảo mật',
    description: 'Lần verify thành công đầu tiên sẽ bật factor và phát hành danh sách recovery codes (chỉ hiển thị 1 lần).',
  })
  @SwaggerResponse({ status: HttpStatus.OK, description: 'Xác minh TOTP thành công.' })
  async verifyTotp(
    @CurrentUser() user: TokenPayload,
    @Body() dto: VerifyTotpDto,
  ): Promise<ApiResponse<{ valid: boolean; recoveryCodes?: string[] }>> {
    const result = await this.mfaService.verifyTotp(user.sub, dto.code);
    return ApiResponse.ok(result);
  }

  @Get('factors')
  @ApiOperation({
    summary: '[MFA] Liệt kê các yếu tố MFA đang hoạt động',
    description: 'Trả về danh sách factor đã bật và số mã phục hồi còn lại.',
  })
  async listFactors(
    @CurrentUser() user: TokenPayload,
  ): Promise<
    ApiResponse<{
      factors: { id: string; type: string; label: string | null; isEnabled: boolean; verifiedAt: Date | null }[];
      remainingRecoveryCodes: number;
    }>
  > {
    const result = await this.mfaService.listFactors(user.sub);
    return ApiResponse.ok(result);
  }

  @Post('recovery/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({
    summary: '[MFA] Dùng mã phục hồi (recovery code, dùng một lần)',
    description: 'Mã được so sánh hash SHA-256 an toàn thời gian và đánh dấu đã dùng ngay sau khi khớp.',
  })
  async verifyRecoveryCode(
    @CurrentUser() user: TokenPayload,
    @Body() dto: VerifyRecoveryCodeDto,
  ): Promise<ApiResponse<{ valid: boolean; remaining: number }>> {
    const result = await this.mfaService.verifyRecoveryCode(user.sub, dto.code);
    return ApiResponse.ok(result);
  }

  @Delete('factors/:factorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[MFA] Tắt một yếu tố MFA',
    description: 'Vô hiệu hóa factor và thu hồi toàn bộ mã phục hồi còn lại của người dùng.',
  })
  async disableFactor(
    @CurrentUser() user: TokenPayload,
    @Param('factorId') factorId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    await this.mfaService.disableFactor(user.sub, factorId);
    return ApiResponse.ok({ message: 'Đã tắt yếu tố MFA thành công' });
  }

  // ------------------------------------------------------------------------------------
  // Passkey (WebAuthn / FIDO2)
  // ------------------------------------------------------------------------------------

  @Post('passkey/register/options')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({
    summary: '[Passkey] B1: Tạo WebAuthn creation options (đã đăng nhập)',
    description: 'Trả về options cho navigator.credentials.create() kèm challengeId (hiệu lực 5 phút).',
  })
  async passkeyRegisterOptions(
    @CurrentUser() user: TokenPayload,
  ): Promise<ApiResponse<Record<string, unknown>>> {
    const options = await this.passkeyService.startRegistration(user.sub, user.email || user.sub);
    return ApiResponse.ok(options);
  }

  @Post('passkey/register/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({
    summary: '[Passkey] B2: Xác minh attestation response và lưu public key credential',
    description: 'Private key không bao giờ rời thiết bị; server chỉ lưu public key + sign count chống replay.',
  })
  async passkeyRegisterVerify(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CompletePasskeyRegistrationDto,
  ): Promise<ApiResponse<{ credentialId: string; message: string }>> {
    const result = await this.passkeyService.completeRegistration(
      user.sub,
      dto.challengeId,
      dto.response as unknown as RegistrationResponseJSON,
      dto.deviceName,
    );
    return ApiResponse.ok({ credentialId: result.credentialId, message: result.message });
  }

  @Post('passkey/authenticate/options')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: '[Passkey] B1: Tạo WebAuthn request options để đăng nhập (Public)',
    description: 'Phát hiện tài khoản theo email (discoverable). Trả về options cho navigator.credentials.get() + challengeId.',
  })
  async passkeyAuthOptions(
    @Body() dto: StartPasskeyAuthenticationDto,
  ): Promise<ApiResponse<Record<string, unknown>>> {
    const options = await this.passkeyService.startAuthentication(dto.email);
    return ApiResponse.ok(options);
  }

  @Post('passkey/authenticate/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập passkey thành công, cấp cặp token JWT.',
    type: AuthResponseDto,
  })
  @ApiOperation({
    summary: '[Passkey] B2: Xác minh assertion và cấp cặp token JWT (Public)',
    description: 'So khớp public key đã lưu, kiểm tra sign count chống replay, phát hành session.',
  })
  async passkeyAuthVerify(
    @Body() dto: CompletePasskeyAuthenticationDto,
  ): Promise<ApiResponse<AuthResponseDto>> {
    const result = await this.passkeyService.completeAuthentication(
      dto.challengeId,
      dto.response as unknown as AuthenticationResponseJSON,
      MfaController.buildClientContext(undefined, undefined, dto.deviceName),
    );
    return ApiResponse.ok(result);
  }
}
