/**
 * Policy phân giải danh sách role "toàn quyền" từ CẤU HÌNH (env SUPER_ADMIN_ROLES, csv),
 * không hard-code tên role chuỗi literals trong guard — đổi tên/bổ sung super role
 * chỉ cần sửa env + restart, không sửa code.
 */
export const DEFAULT_SUPER_ADMIN_ROLES = ['SUPER_ADMIN'];

/** Danh sách role mặc định cho user mới khi chưa cấu hình env DEFAULT_USER_ROLE. */
export const DEFAULT_USER_ROLE_FALLBACK = 'USER';

export function resolveSuperAdminRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    const list = raw.map((r) => String(r).trim().toUpperCase()).filter(Boolean);
    return list.length > 0 ? list : [...DEFAULT_SUPER_ADMIN_ROLES];
  }
  if (typeof raw === 'string') {
    const list = raw
      .split(',')
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return [...DEFAULT_SUPER_ADMIN_ROLES];
}

/** User có giữ một trong các super role (theo config) không? */
export function hasSuperAdminRole(userRoles: string[] | undefined, superRoles: string[]): boolean {
  if (!Array.isArray(userRoles)) return false;
  return userRoles.some((role) => superRoles.includes(String(role).trim().toUpperCase()));
}
