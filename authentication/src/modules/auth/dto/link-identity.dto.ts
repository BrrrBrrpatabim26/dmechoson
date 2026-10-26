import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class LinkIdentityDto {
  @ApiProperty({
    description: 'Tên nhà cung cấp danh tính (ví dụ: google, github, phone, apple)',
    example: 'google',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'Provider phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Provider không được để trống' })
  provider: string;

  @ApiProperty({
    description: 'ID người dùng tại nhà cung cấp (Google sub, GitHub id, phone number)',
    example: '109823482734918237',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'ProviderUserId phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'ProviderUserId không được để trống' })
  providerUserId: string;

  @ApiPropertyOptional({
    description: 'Email liên kết với provider nếu có',
    example: 'user@gmail.com',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Thông tin bổ sung hoặc profile snapshot từ provider',
    example: { avatar_url: 'https://lh3.googleusercontent.com/...', name: 'John Doe' },
  })
  @IsOptional()
  @IsObject()
  profile?: Record<string, unknown>;
}
