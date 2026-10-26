/**
 * Danh mục mã quyền nguyên tử (Atomic Permission Codes).
 *
 * Định dạng: `<resource>:<action>` hoặc `<resource>:<sub-resource>:<action>`.
 */
export const PERMISSION_CODES = {
  // Quyền cơ bản người dùng (Gán mặc định cho role USER)
  USER_PROFILE_READ: 'user:profile:read',
  USER_PROFILE_UPDATE: 'user:profile:update',
  AUTH_CHANGE_PASSWORD: 'auth:change-password',
  AUTH_SESSION_REVOKE: 'auth:session:revoke',

  // Quyền quản trị người dùng & tổ chức (Dành cho Quản trị viên)
  USER_MANAGE: 'user:manage',
  USER_DELETE: 'user:delete',
  ROLE_MANAGE: 'role:manage',
  PERMISSION_MANAGE: 'permission:manage',
  ORG_MANAGE: 'org:manage',
  AUDIT_LOG_READ: 'audit:log:read',
} as const;

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];

/**
 * Danh mục vai trò mặc định trong hệ thống.
 */
export const DEFAULT_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type DefaultRole = (typeof DEFAULT_ROLES)[keyof typeof DEFAULT_ROLES];

/**
 * Tập hợp quyền mặc định cấp cho tài khoản người dùng thông thường khi đăng ký.
 */
export const DEFAULT_USER_PERMISSIONS: PermissionCode[] = [
  PERMISSION_CODES.USER_PROFILE_READ,
  PERMISSION_CODES.USER_PROFILE_UPDATE,
  PERMISSION_CODES.AUTH_CHANGE_PASSWORD,
  PERMISSION_CODES.AUTH_SESSION_REVOKE,
];
