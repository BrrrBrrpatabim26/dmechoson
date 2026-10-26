import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO phản hồi thông tin phiên đăng nhập (Session).
 */
export class SessionResponseDto {
  @ApiProperty({ description: 'Mã định danh duy nhất của phiên (UUIDv7)', example: '0192e47b-891a-7b3b-9e4a-9b19e2300000' })
  id: string;

  @ApiProperty({ description: 'ID người dùng sở hữu phiên', example: '0192e47b-891a-7b3b-9e4a-9b19e2300001' })
  userId: string;

  @ApiProperty({ description: 'Địa chỉ IP đăng nhập của phiên', example: '127.0.0.1', nullable: true })
  ip: string | null;

  @ApiProperty({ description: 'Thông tin User-Agent của phiên', example: 'Mozilla/5.0...', nullable: true })
  userAgent: string | null;

  @ApiProperty({ description: 'Tên thiết bị nhận diện được', example: 'Chrome on Windows', nullable: true, required: false })
  deviceName?: string | null;

  @ApiProperty({ description: 'Thời điểm tạo phiên', example: '2026-10-14T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời điểm hoạt động gần nhất', example: '2026-10-14T08:15:00.000Z' })
  lastSeenAt: Date;

  @ApiProperty({ description: 'Thời điểm phiên sẽ hết hạn', example: '2026-10-21T08:00:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ description: 'Đánh dấu có phải phiên hiện tại của request này không', example: true, required: false })
  isCurrent?: boolean;
}
