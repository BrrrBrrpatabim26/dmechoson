import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { TokenPayload } from '../../core/interfaces/token-service.interface.js';
import { ROLES_KEY } from '../decorators/require-roles.decorator.js';
import { RoleDeniedException } from '../exceptions/forbidden.exception.js';
import { hasSuperAdminRole, resolveSuperAdminRoles } from '../utils/super-roles.util.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    // Optional: unit test cũ khởi tạo 1 tham số vẫn chạy (fallback về danh sách mặc định).
    @Optional() private readonly configService?: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu endpoint không yêu cầu vai trò cụ thể -> Cho qua
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as TokenPayload;

    if (!user || !Array.isArray(user.roles)) {
      throw new RoleDeniedException(requiredRoles);
    }

    // Super role khong hard-code — lay tu cau hinh SUPER_ADMIN_ROLES (csv, mac dinh SUPER_ADMIN).
    const superRoles = resolveSuperAdminRoles(this.configService?.get<string[]>('auth.superAdminRoles'));
    if (hasSuperAdminRole(user.roles, superRoles)) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new RoleDeniedException(requiredRoles);
    }

    return true;
  }
}
