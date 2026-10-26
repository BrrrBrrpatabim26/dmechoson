import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyMagicLinkDto {
  @ApiProperty({
    description: 'Token xác thực từ Magic Link URL',
    example: 'd9b9a69e4f58c73d9e8471cf499c82b5420d43a598d9e7ec78465d66ef3a1109',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Token phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Token không được để trống' })
  token: string;

  @ApiPropertyOptional({
    description: 'Tên thiết bị (dùng cho Session / Device tracking)',
    example: 'Chrome on Windows 11',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
