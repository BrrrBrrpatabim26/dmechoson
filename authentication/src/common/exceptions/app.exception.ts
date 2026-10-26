import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '../constants/error-codes.constant.js';

/**
 * Lớp trừu tượng AppException làm gốc cho mọi Exception nghiệp vụ trong hệ thống.
 */
export abstract class AppException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
  ) {
    super(
      {
        errorCode,
        message,
        details: details ?? null,
      },
      statusCode,
    );
  }
}
