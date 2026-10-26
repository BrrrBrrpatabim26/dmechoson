import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PERMISSION_CODES } from '../../common/constants/permission-codes.constant.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ApiResponse } from '../../common/responses/api-response.dto.js';
import type { UserAccessControl } from '../../core/interfaces/rbac.interface.js';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import { Inject } from '@nestjs/common';
import { RbacService } from './rbac.service.js';
import { AssignRoleDto, CreateRoleDto, GrantPermissionsDto } from './dto/rbac-admin.dto.js';

/**
 * Controller Quản trị RBAC (chỉ ADMIN / SUPER_ADMIN).
 *
 * Bịt khoảng trống provisioning: trước đây chỉ có THỰC THI quyền (guard) mà không có
 * đường QUẢN TRỊ quyền — không tạo được role, không gán permission, không phong/gỡ role
 * cho user (SUPER_ADMIN không thể được tạo qua API).
 *
 * mặc định phòng thủ: mọi endpoint đều qua JwtAuthGuard (global) + RolesGuard +
 * PermissionsGuard với @RequireRoles/@RequirePermissions cụ thể.
 */
@ApiTags('Admin RBAC (Quản trị phân quyền)')
@Controller({ path: 'admin/rbac', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@RequireRoles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth('Bearer')
export class RbacAdminController {
  constructor(
    @Inject(INJECTION_TOKENS.RBAC_SERVICE)
    private readonly rbacService: RbacService,
  ) {}

  @Get('roles')
  @RequirePermissions(PERMISSION_CODES.ROLE_MANAGE)
  @ApiOperation({ summary: '[RBAC] Liệt kê toàn bộ role hệ thống' })
  async listRoles(): Promise<ApiResponse<Awaited<ReturnType<RbacService['listRoles']>>>> {
    return ApiResponse.ok(await this.rbacService.listRoles());
  }

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @RequirePermissions(PERMISSION_CODES.ROLE_MANAGE)
  @ApiOperation({ summary: '[RBAC] Tạo role tùy chỉnh (idempotent theo tên)' })
  @SwaggerResponse({ status: HttpStatus.CREATED, description: 'Role đã tạo/đã tồn tại.' })
  async createRole(@Body() dto: CreateRoleDto): Promise<ApiResponse<{ id: string; name: string; description: string | null; isSystem: boolean }>> {
    return ApiResponse.ok(await this.rbacService.createRole(dto.name, dto.description));
  }

  @Post('roles/:roleId/permissions')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @RequirePermissions(PERMISSION_CODES.PERMISSION_MANAGE)
  @ApiOperation({
    summary: '[RBAC] Gán permission codes cho role (tự tạo permission row nếu chưa có)',
    description: 'Idempotent; quyền mới có hiệu lực với user sau TTL cache RBAC (<=60s) và/hoặc access token kế tiếp (refresh).',
  })
  async grantPermissions(
    @Param('roleId') roleId: string,
    @Body() dto: GrantPermissionsDto,
  ): Promise<ApiResponse<{ roleId: string; granted: string[] }>> {
    return ApiResponse.ok(await this.rbacService.grantPermissionsToRole(roleId, dto.codes));
  }

  @Get('roles/:roleId/permissions')
  @RequirePermissions(PERMISSION_CODES.ROLE_MANAGE)
  @ApiOperation({ summary: '[RBAC] Liệt kê permission code đang gán với role' })
  async listRolePermissions(
    @Param('roleId') roleId: string,
  ): Promise<ApiResponse<{ roleId: string; permissions: string[] }>> {
    const permissions = await this.rbacService.listRolePermissions(roleId);
    return ApiResponse.ok({ roleId, permissions });
  }

  @Delete('roles/:roleId/permissions/:code')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @RequirePermissions(PERMISSION_CODES.PERMISSION_MANAGE)
  @ApiOperation({ summary: '[RBAC] Thu hồi MỘT permission code khỏi role (đảo ngược grant)' })
  async revokePermission(
    @Param('roleId') roleId: string,
    @Param('code') code: string,
  ): Promise<ApiResponse<{ roleId: string; revoked: string }>> {
    return ApiResponse.ok(await this.rbacService.revokePermissionFromRole(roleId, code));
  }

  @Delete('roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @RequirePermissions(PERMISSION_CODES.ROLE_MANAGE)
  @ApiOperation({
    summary: '[RBAC] Xóa role động (dọn membership_roles + role_permissions trong transaction)',
    description: 'Từ chối xóa role isSystem HOẶC role đang được tham chiếu bởi cấu hình SUPER_ADMIN_ROLES.',
  })
  async deleteRole(@Param('roleId') roleId: string): Promise<ApiResponse<{ deleted: string }>> {
    return ApiResponse.ok(await this.rbacService.deleteRole(roleId));
  }

  @Post('users/:userId/roles')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @RequirePermissions(PERMISSION_CODES.ROLE_MANAGE)
  @ApiOperation({ summary: '[RBAC] Phong role cho user theo tên (kèm validate role tồn tại)', })
  @SwaggerResponse({ status: HttpStatus.OK, description: 'Trả về roles/permissions MỚI nhất của user.', })
  async assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ): Promise<ApiResponse<UserAccessControl>> {
    return ApiResponse.ok(await this.rbacService.assignRoleToUserByName(userId, dto.roleName));
  }

  @Delete('users/:userId/roles/:roleName')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @RequirePermissions(PERMISSION_CODES.ROLE_MANAGE)
  @ApiOperation({
    summary: '[RBAC] Gỡ role khỏi user (chống lockout: không tự hạ SUPER_ADMIN, không gỡ SUPER_ADMIN cuối cùng)',
  })
  async revokeRole(
    @CurrentUser('sub') actorId: string,
    @Param('userId') userId: string,
    @Param('roleName') roleName: string,
  ): Promise<ApiResponse<UserAccessControl>> {
    return ApiResponse.ok(await this.rbacService.revokeRoleFromUserByName(userId, roleName, actorId));
  }

  @Get('users/:userId/access')
  @RequirePermissions(PERMISSION_CODES.USER_MANAGE)
  @ApiOperation({ summary: '[RBAC] Xem effective roles/permissions của một user (bỏ cache đọc trực tiếp DB qua TTL)' })
  async getUserAccess(@Param('userId') userId: string): Promise<ApiResponse<UserAccessControl>> {
    return ApiResponse.ok(await this.rbacService.getUserAccess(userId));
  }
}
