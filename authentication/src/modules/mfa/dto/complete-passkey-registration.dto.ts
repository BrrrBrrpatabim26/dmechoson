import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * DTO hoàn tất đăng ký passkey (WebAuthn registration response từ trình duyệt).
 */
export class CompletePasskeyRegistrationDto {
  @ApiProperty({
    description: 'challengeId trả về từ bước /passkey/register/options',
    example: 'dXMywQ3-8xmFmxakuuAX3TTXbs_kq-mtTUGs6o',
  })
  @IsString()
  @IsNotEmpty({ message: 'challengeId không được để trống' })
  challengeId: string;

  @ApiProperty({
    description: 'Đối tượng RegistrationResponseJSON do navigator.credentials.create() sinh ra',
  })
  @IsObject({ message: 'response phải là đối tượng WebAuthn RegistrationResponseJSON' })
  response: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Tên thiết bị lưu passkey', example: 'Windows Hello / YubiKey 5' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
