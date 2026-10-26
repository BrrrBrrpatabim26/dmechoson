export interface UserAccessControl {
  roles: string[];
  permissions: string[];
}

/**
 * Interface cho dịch vụ Quản lý phân quyền theo vai trò (RBAC) và thuộc tính/quyền nguyên tử (PBAC).
 */
export interface IRbacService {
  /**
   * Lấy danh sách Roles và Permissions của người dùng từ Database.
   * Nếu user chưa có cấu hình riêng, trả về quyền và vai trò mặc định.
   */
  getUserAccess(userId: string, orgId?: string | null): Promise<UserAccessControl>;

  /**
   * Khởi tạo và gán vai trò cùng quyền mặc định cho người dùng mới đăng ký.
   */
  assignDefaultAccess(userId: string): Promise<UserAccessControl>;

  /**
   * Kiểm tra quyền: Người dùng có sở hữu toàn bộ các quyền yêu cầu hay không.
   */
  hasPermissions(userPermissions: string[], requiredPermissions: string[]): boolean;

  /**
   * Kiểm tra vai trò: Người dùng có thuộc ít nhất một trong các vai trò yêu cầu hay không.
   */
  hasRoles(userRoles: string[], requiredRoles: string[]): boolean;

  // ---- Quản trị RBAC (admin API) ----
  /** Tạo (hoặc lấy nếu trùng tên) một role tùy chỉnh không thuộc hệ thống. */
  createRole(name: string, description?: string): Promise<{ id: string; name: string; description: string | null; isSystem: boolean }>;
  /** Liệt kê toàn bộ role trong hệ thống. */
  listRoles(): Promise<{ id: string; name: string; description: string | null; isSystem: boolean }[]>;
  /** Gán danh sách permission code cho role (tự tạo permission row nếu chưa có; idempotent). */
  grantPermissionsToRole(roleId: string, codes: string[]): Promise<{ roleId: string; granted: string[] }>;
  /** Gán role theo tên cho user; vô hiệu hóa cache quyền của user đó. */
  assignRoleToUserByName(userId: string, roleName: string): Promise<UserAccessControl>;
  /** Gỡ role theo tên khỏi user; bảo vệ last-SUPER_ADMIN và tự hạ quyền chính mình. */
  revokeRoleFromUserByName(userId: string, roleName: string, actorUserId: string): Promise<UserAccessControl>;
  /** Liệt kê permission code đang gán với một role. */
  listRolePermissions(roleId: string): Promise<string[]>;
  /** Thu hồi một permission code khỏi role (đảo lại grantPermissionsToRole). */
  revokePermissionFromRole(roleId: string, code: string): Promise<{ roleId: string; revoked: string }>;
  /** Xóa role động (từ chối role isSystem); dọn quan hệ gán trong transaction. */
  deleteRole(roleId: string): Promise<{ deleted: string }>;
}
