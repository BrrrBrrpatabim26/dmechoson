import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class SignupDto {
  @ApiProperty({
    description: 'Email hoặc tên đăng nhập; cần cung cấp ít nhất một trong hai',
    example: 'user@example.com',
    required: false,
  })
  @ValidateIf((dto: SignupDto) => !dto.username)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email không đúng định dạng hợp lệ' })
  email?: string;

  @ApiProperty({
    description: 'Tên đăng nhập duy nhất, 3-50 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang',
    example: 'nguyenvana',
    required: false,
  })
  @ValidateIf((dto: SignupDto) => !dto.email)
  @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
  @Matches(/^[a-zA-Z0-9_.-]{3,50}$/, { message: 'Tên đăng nhập không hợp lệ' })
  username?: string;

  @ApiProperty({
    description: 'Mật khẩu tài khoản (tối thiểu 8 ký tự)',
    example: 'P@ssword123',
    minLength: 8,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Password phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Password không được để trống' })
  @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
  @MaxLength(64, { message: 'Password không được vượt quá 64 ký tự' })
  password: string;

  @ApiPropertyOptional({
    description: 'Tên hiển thị người dùng',
    example: 'Nguyễn Văn A',
    default: 'User',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  userName?: string;

  @ApiPropertyOptional({
    description: 'Ngôn ngữ ưu tiên',
    example: 'vi',
    default: 'vi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @ApiPropertyOptional({
    description: 'Múi giờ làm việc',
    example: 'Asia/Ho_Chi_Minh',
    default: 'Asia/Ho_Chi_Minh',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
