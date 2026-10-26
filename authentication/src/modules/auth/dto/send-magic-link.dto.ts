import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class SendMagicLinkDto {
  @ApiProperty({
    description: 'Email nhận Magic Link',
    example: 'user@example.com',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'Email phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng hợp lệ' })
  email: string;

  @ApiPropertyOptional({
    description: 'URL chuyen huong sau khi bam Magic Link (BAT BUOC cung origin voi CLIENT_URL)',
    example: 'https://app.example.com/auth/callback',
  })
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'Redirect URL không đúng định dạng URL' })
  redirectUrl?: string;
}
