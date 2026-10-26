import { Entity, PrimaryColumn } from 'typeorm';

/** Bảng nối N-N giữa role và permission; khóa ghép không cần id giả. */
@Entity('role_permissions')
export class RolePermission {
  /** Nửa đầu khóa chính ghép, đồng thời tham chiếu role. */
  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId: string;

  /** Nửa còn lại của khóa chính ghép, đồng thời tham chiếu permission. */
  @PrimaryColumn({ name: 'permission_id', type: 'uuid' })
  permissionId: string;
}
