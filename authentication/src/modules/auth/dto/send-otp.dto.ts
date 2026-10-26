import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Địa chỉ nhận OTP (email hoặc số điện thoại)',
    example: 'user@example.com',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'Target phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Target không được để trống' })
  target: string;

  @ApiProperty({
    description: 'Kênh gửi mã OTP',
    enum: ['email', 'sms'],
    example: 'email',
    default: 'email',
  })
  @IsOptional()
  @IsIn(['email', 'sms'], { message: 'Channel phải là email hoặc sms' })
  channel?: 'email' | 'sms' = 'email';

  @ApiPropertyOptional({
    description: 'Mục đích gửi OTP',
    enum: ['login', 'signup', 'reset_password', 'link'],
    example: 'login',
    default: 'login',
  })
  @IsOptional()
  @IsIn(['login', 'signup', 'reset_password', 'link'], {
    message: 'Purpose không hợp lệ',
  })
  purpose?: 'login' | 'signup' | 'reset_password' | 'link' = 'login';
}
