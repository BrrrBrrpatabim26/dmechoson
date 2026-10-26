import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO phản hồi thông tin chi tiết một bản ghi Audit Log.
 */
export class AuditLogResponseDto {
  @ApiProperty({ description: 'ID duy nhất của sự kiện audit log (UUIDv7)', example: '0192e47b-891a-7b3b-9e4a-9b19e2300000' })
  id: string;

  @ApiProperty({ description: 'ID người dùng liên quan', example: '0192e47b-891a-7b3b-9e4a-9b19e2300001', nullable: true })
  userId: string | null;

  @ApiProperty({ description: 'Loại sự kiện xác thực', example: 'auth.signin.success' })
  eventType: string;

  @ApiProperty({ description: 'Kết quả sự kiện (true: thành công, false: thất bại)', example: true })
  success: boolean;

  @ApiProperty({ description: 'Địa chỉ IP nguồn', example: '127.0.0.1', nullable: true })
  ip: string | null;

  @ApiProperty({ description: 'User-Agent của thiết bị', example: 'Mozilla/5.0...', nullable: true })
  userAgent: string | null;

  @ApiProperty({
    description: 'Dữ liệu metadata phi bí mật đi kèm',
    example: { ip: '127.0.0.1' },
    type: 'object',
    additionalProperties: true,
  })
  metadata: Record<string, unknown>;

  @ApiProperty({ description: 'Thời điểm phát sinh sự kiện', example: '2026-10-14T08:00:00.000Z' })
  createdAt: Date;
}
