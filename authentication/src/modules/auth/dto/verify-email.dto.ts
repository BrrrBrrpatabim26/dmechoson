import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO xác thực token nhận từ link xác minh email (Email Verification).
 */
export class VerifyEmailDto {
  @ApiProperty({
    description: 'Chuỗi token nhận được từ tham số query của link xác minh email',
    example: 'ZuMvC1EwYNIO74ts_6Pz2pcrU4HfhZZBtxVqK-oZDjQ',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token xác minh email không được để trống' })
  token: string;
}
