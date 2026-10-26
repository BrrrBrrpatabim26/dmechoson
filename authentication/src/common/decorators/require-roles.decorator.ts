import { SetMetadata } from '@nestjs/common';
import type { DefaultRole } from '../constants/permission-codes.constant.js';

export const ROLES_KEY = 'roles';

/**
 * Decorator `@RequireRoles('ADMIN', ...)` kiểm soát vai trò truy cập endpoint.
 */
export const RequireRoles = (...roles: (DefaultRole | (string & {}))[]) =>
  SetMetadata(ROLES_KEY, roles);
