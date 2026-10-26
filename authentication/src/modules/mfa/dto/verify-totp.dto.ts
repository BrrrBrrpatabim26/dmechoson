import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/**
 * DTO xác minh mã TOTP 6 số (RFC 6238).
 */
export class VerifyTotpDto {
  @ApiProperty({
    description: 'Mã TOTP 6 chữ số từ ứng dụng xác thực (Google Authenticator, Authy...)',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mã TOTP không được để trống' })
  @Length(6, 8, { message: 'Mã TOTP phải có 6-8 ký tự' })
  @Matches(/^\d{6,8}$/, { message: 'Mã TOTP chỉ chứa các chữ số' })
  code: string;
}
