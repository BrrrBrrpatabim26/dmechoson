import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../constants/error-codes.constant.js';
import { AppException } from './app.exception.js';

export class PermissionDeniedException extends AppException {
  constructor(missingPermissions: string[]) {
    super(
      ERROR_CODES.FORBIDDEN_PERMISSION,
      `Bạn không có đủ quyền thực hiện hành động này. Yêu cầu quyền: [${missingPermissions.join(', ')}]`,
      HttpStatus.FORBIDDEN,
      { requiredPermissions: missingPermissions },
    );
  }
}

export class RoleDeniedException extends AppException {
  constructor(requiredRoles: string[]) {
    super(
      ERROR_CODES.FORBIDDEN_ROLE,
      `Yêu cầu vai trò: [${requiredRoles.join(', ')}] để truy cập tài nguyên này`,
      HttpStatus.FORBIDDEN,
      { requiredRoles },
    );
  }
}
