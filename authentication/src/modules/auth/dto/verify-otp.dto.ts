import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Địa chỉ nhận OTP (email hoặc số điện thoại)',
    example: 'user@example.com',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'Target phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Target không được để trống' })
  target: string;

  @ApiProperty({
    description: 'Mã số OTP (6 chữ số)',
    example: '123456',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'OTP phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'OTP không được để trống' })
  otp: string;

  @ApiPropertyOptional({
    description: 'Mục đích xác thực OTP',
    enum: ['login', 'signup', 'reset_password', 'link'],
    example: 'login',
    default: 'login',
  })
  @IsOptional()
  @IsIn(['login', 'signup', 'reset_password', 'link'], {
    message: 'Purpose không hợp lệ',
  })
  purpose?: 'login' | 'signup' | 'reset_password' | 'link' = 'login';

  @ApiPropertyOptional({
    description: 'Tên hiển thị (dùng khi tự động tạo tài khoản mới nếu chưa tồn tại)',
    example: 'Nguyen Van A',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Tên thiết bị (dùng cho Session / Device tracking)',
    example: 'Chrome on Windows 11',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
