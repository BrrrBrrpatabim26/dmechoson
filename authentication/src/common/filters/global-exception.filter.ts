import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ERROR_CODES } from '../constants/error-codes.constant.js';
import { AppException } from '../exceptions/app.exception.js';
import { ApiErrorResponse } from '../responses/api-error.dto.js';

/**
 * Global Exception Filter: Đón và chuẩn hóa 100% các ngoại lệ thành định dạng JSON đồng nhất.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ERROR_CODES.INTERNAL_SERVER_ERROR;
    let message = 'Đã xảy ra lỗi nội bộ máy chủ';
    let details: unknown = null;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      code = exception.errorCode;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.mapStatusToErrorCode(status);
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;
        message = Array.isArray(resObj.message)
          ? resObj.message.join('; ')
          : resObj.message || exception.message;

        details = Array.isArray(resObj.message) ? resObj.message : resObj.details || null;
        code = resObj.errorCode || (Array.isArray(resObj.message) ? ERROR_CODES.VALIDATION_ERROR : this.mapStatusToErrorCode(status));
      }
    } else if (exception instanceof Error) {
      // Khong tra message loi noi bo ra client (tranh leak internal/stack - muc 7, bao mat).
      // Van giu message = thong diep chung 500 o phia tren; chi log chi tiet server-side.
      this.logger.error(
        `[UNHANDLED ERROR] ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    const payload = ApiErrorResponse.of(code, message, details);

    response.status(status).json(payload);
  }

  private mapStatusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODES.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.AUTH_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.FORBIDDEN_RESOURCE;
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return ERROR_CODES.THROTTLE_EXCEEDED;
      default:
        return ERROR_CODES.INTERNAL_SERVER_ERROR;
    }
  }
}
