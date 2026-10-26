import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '../constants/permission-codes.constant.js';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator `@RequirePermissions('user:profile:read', ...)` kiểm soát quyền truy cập endpoint.
 * Phải được dùng cùng với `JwtAuthGuard` và `PermissionsGuard`.
 */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
