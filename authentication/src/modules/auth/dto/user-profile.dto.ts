import { ApiProperty } from '@nestjs/swagger';

export class UserProfileEmailDto {
  @ApiProperty({ example: '0192e47b-891a-7b3b-9e4a-9b19e2300001' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: true })
  isPrimary: boolean;

  @ApiProperty({ example: null, nullable: true })
  verifiedAt: Date | null;
}

export class UserProfileDto {
  @ApiProperty({ example: '0192e47b-891a-7b3b-9e4a-9b19e2300000' })
  id: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  userName: string;

  @ApiProperty({ example: null, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: 'vi' })
  locale: string;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: ['USER'] })
  roles: string[];

  @ApiProperty({ example: ['user:profile:read', 'user:profile:update', 'auth:change-password'] })
  permissions: string[];

  @ApiProperty({ example: '2026-10-14T08:00:00.000Z', nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ example: '2026-10-14T07:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: [UserProfileEmailDto] })
  emails: UserProfileEmailDto[];
}
