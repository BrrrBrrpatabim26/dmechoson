import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO xác minh mã phục hồi MFA (recovery code dùng một lần).
 */
export class VerifyRecoveryCodeDto {
  @ApiProperty({
    description: 'Mã phục hồi được cấp khi bật MFA (định dạng XXXXXXXX-XXXXXXXX)',
    example: 'A1B2C3D4-E5F6A7B8',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mã phục hồi không được để trống' })
  code: string;
}
