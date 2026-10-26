import { describe, it, expect, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from '../src/common/guards/permissions.guard.js';
import { PermissionDeniedException } from '../src/common/exceptions/forbidden.exception.js';
import type { TokenPayload } from '../src/core/interfaces/token-service.interface.js';

describe('PermissionsGuard (Kiểm soát phân quyền)', () => {
  it('Cho phép truy cập nếu endpoint không yêu cầu quyền', () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const guard = new PermissionsGuard(reflector);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { permissions: [] } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('Cho phép truy cập nếu người dùng sở hữu đủ quyền yêu cầu', () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user:profile:read']);

    const guard = new PermissionsGuard(reflector);
    const mockUser: Partial<TokenPayload> = {
      permissions: ['user:profile:read', 'user:profile:update'],
      roles: ['USER'],
    };

    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('Ném PermissionDeniedException nếu người dùng thiếu quyền', () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user:manage']);

    const guard = new PermissionsGuard(reflector);
    const mockUser: Partial<TokenPayload> = {
      permissions: ['user:profile:read'],
      roles: ['USER'],
    };

    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(PermissionDeniedException);
  });

  it('Cho phép SUPER_ADMIN vượt qua mọi kiểm tra quyền (Wildcard bypass)', () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['critical:system:delete']);

    const guard = new PermissionsGuard(reflector);
    const mockUser: Partial<TokenPayload> = {
      permissions: ['user:profile:read'],
      roles: ['SUPER_ADMIN'],
    };

    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
