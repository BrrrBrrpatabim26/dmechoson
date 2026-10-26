import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty({ example: true, description: 'Trạng thái thành công của yêu cầu' })
  readonly success: boolean;

  @ApiProperty({ description: 'Dữ liệu kết quả phản hồi' })
  readonly data: T;

  @ApiProperty({ example: '2026-10-14T08:00:00.000Z', description: 'Thời điểm tạo phản hồi ISO 8601' })
  readonly timestamp: string;

  constructor(success: boolean, data: T) {
    this.success = success;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static ok<T>(data: T): ApiResponse<T> {
    return new ApiResponse(true, data);
  }
}
