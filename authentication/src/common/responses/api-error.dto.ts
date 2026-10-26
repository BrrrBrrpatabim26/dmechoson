import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetailsDto {
  @ApiProperty({ example: 'AUTH_INVALID_CREDENTIALS', description: 'Mã định danh lỗi' })
  readonly code: string;

  @ApiProperty({ example: 'Email hoặc mật khẩu không chính xác', description: 'Thông báo lỗi chi tiết' })
  readonly message: string;

  @ApiProperty({ example: null, required: false, description: 'Chi tiết bổ sung hoặc danh sách lỗi validation' })
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    this.code = code;
    this.message = message;
    this.details = details ?? null;
  }
}

export class ApiErrorResponse {
  @ApiProperty({ example: false })
  readonly success: boolean = false;

  @ApiProperty({ type: ErrorDetailsDto })
  readonly error: ErrorDetailsDto;

  @ApiProperty({ example: '2026-10-14T08:00:00.000Z' })
  readonly timestamp: string;

  constructor(code: string, message: string, details?: unknown) {
    this.success = false;
    this.error = new ErrorDetailsDto(code, message, details);
    this.timestamp = new Date().toISOString();
  }

  static of(code: string, message: string, details?: unknown): ApiErrorResponse {
    return new ApiErrorResponse(code, message, details);
  }
}
