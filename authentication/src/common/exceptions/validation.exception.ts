import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../constants/error-codes.constant.js';
import { AppException } from './app.exception.js';

export class ValidationException extends AppException {
  constructor(errors: unknown, message: string = 'Dữ liệu đầu vào không hợp lệ') {
    super(ERROR_CODES.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, errors);
  }
}
