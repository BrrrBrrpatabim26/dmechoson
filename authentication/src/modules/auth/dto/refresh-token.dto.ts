import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Chuỗi Refresh Token nhận được khi đăng nhập hoặc xoay vòng token gần nhất',
    example: 'dGhpcy1pcy1hLXNhbXBsZS1yZWZyZXNoLXRva2VuLTIwMjY',
  })
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  refreshToken: string;
}
