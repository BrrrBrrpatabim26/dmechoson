import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: '0192e47b-891a-7b3b-9e4a-9b19e2300000' })
  id: string;

  @ApiProperty({ example: 'user@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  userName: string;

  @ApiProperty({ example: null, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: ['USER'], description: 'Danh sách các vai trò của tài khoản' })
  roles: string[];

  @ApiProperty({
    example: ['user:profile:read', 'user:profile:update', 'auth:change-password'],
    description: 'Danh sách các quyền nguyên tử (Atomic permissions)',
  })
  permissions: string[];
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Access Token định dạng JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh Token xoay vòng',
    example: 'dGhpcy1pcy1hLXNhbXBsZS1yZWZyZXNoLXRva2VuLTIwMjY',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Thời gian hiệu lực của Access Token tính bằng giây',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Loại token',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Thông tin tài khoản kèm danh sách vai trò và quyền hạn',
    type: AuthUserDto,
  })
  user: AuthUserDto;
}
