import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class SigninDto {
  @ApiPropertyOptional({
    description: 'Email hoặc tên đăng nhập',
    example: 'user@example.com',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsString({ message: 'Identifier phải là chuỗi ký tự' })
  identifier?: string;

  @ApiPropertyOptional({ description: 'Tương thích ngược với client cũ chỉ gửi email', example: 'user@example.com' })
  @ValidateIf((dto: SigninDto) => !dto.identifier)
  @IsEmail({}, { message: 'Email không đúng định dạng hợp lệ' })
  email?: string;

  @ApiProperty({
    description: 'Mật khẩu tài khoản',
    example: 'P@ssword123',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;

  @ApiPropertyOptional({
    description: 'Tên thiết bị đăng nhập (dùng cho Device tracking)',
    example: 'MacBook Pro M2 - Chrome',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({
    description:
      'Mã TOTP 6 số. BẮT BUỘC khi tài khoản đã bật MFA; bị bỏ qua nếu tài khoản chưa bật yếu tố thứ hai.',
    example: '123456',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Mã TOTP phải đúng 6 chữ số' })
  otp?: string;
}
