import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * DTO bắt đầu đăng nhập bằng passkey (public, discover-by-email).
 */
export class StartPasskeyAuthenticationDto {
  @ApiProperty({ description: 'Email tài khoản cần đăng nhập bằng passkey', example: 'nguyenvana@example.com' })
  @IsEmail({}, { message: 'Email không đúng định dạng hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}

/**
 * DTO hoàn tất đăng nhập bằng passkey (WebAuthn assertion response).
 */
export class CompletePasskeyAuthenticationDto {
  @ApiProperty({ description: 'challengeId trả về từ bước /passkey/authenticate/options' })
  @IsString()
  @IsNotEmpty({ message: 'challengeId không được để trống' })
  challengeId: string;

  @ApiProperty({
    description: 'Đối tượng AuthenticationResponseJSON do navigator.credentials.get() sinh ra',
  })
  @IsObject({ message: 'response phải là đối tượng WebAuthn AuthenticationResponseJSON' })
  response: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Tên thiết bị đăng nhập', example: 'Chrome trên Windows 11' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
