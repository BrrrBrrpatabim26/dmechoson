import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Tên role (tự chuẩn hóa UPPER; chỉ [A-Z0-9_-], 2-60 ký tự)', example: 'SUPPORT_AGENT' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]{2,60}$/, { message: 'Tên role chỉ được gồm [A-Za-z0-9_-] độ dài 2-60' })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả mục đích của role' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class GrantPermissionsDto {
  @ApiProperty({
    description: 'Danh sách permission code dạng <resource>:<action>[:<sub>] (tự tạo row nếu chưa có; idempotent)',
    example: ['user:manage', 'audit:log:read'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  codes: string[];
}

export class AssignRoleDto {
  @ApiProperty({ description: 'Tên role cần gán (phải tồn tại — tạo qua POST /roles trước)', example: 'SUPPORT_AGENT' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]{2,60}$/, { message: 'Tên role chỉ được gồm [A-Za-z0-9_-] độ dài 2-60' })
  roleName: string;
}
