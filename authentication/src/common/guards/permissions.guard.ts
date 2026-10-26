import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { TokenPayload } from '../../core/interfaces/token-service.interface.js';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';
import { PermissionDeniedException } from '../exceptions/forbidden.exception.js';
import { hasSuperAdminRole, resolveSuperAdminRoles } from '../utils/super-roles.util.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    // Optional: giữ tuong thich unit test khoi tao 1 tham so.
    @Optional() private readonly configService?: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu endpoint không yêu cầu permission cụ thể nào -> Cho qua
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as TokenPayload;

    if (!user || !Array.isArray(user.permissions)) {
      throw new PermissionDeniedException(requiredPermissions);
    }

    // Toan quyen theo DUA KINH dong (khong hard-code ten role):
    // 1) permission wildcard '*' — cap qua role_permissions trong DB;
    // 2) HOAC giu super role theo cau hinh SUPER_ADMIN_ROLES.
    const superRoles = resolveSuperAdminRoles(this.configService?.get<string[]>('auth.superAdminRoles'));
    if (user.permissions.includes('*') || hasSuperAdminRole(user.roles, superRoles)) {
      return true;
    }

    // Tìm các quyền còn thiếu
    const missingPermissions = requiredPermissions.filter(
      (permission) => !user.permissions.includes(permission),
    );

    if (missingPermissions.length > 0) {
      throw new PermissionDeniedException(missingPermissions);
    }

    return true;
  }
}
