import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Gán role cho membership; kiểm tra role cùng tổ chức cần constraint/trigger ở DB. */
@Entity('membership_roles')
export class MembershipRole {
  /** Thành viên được gán role; cùng với roleId tạo khóa chính ghép. */
  @PrimaryColumn({ name: 'membership_id', type: 'uuid' })
  membershipId: string;

  /** Role được gán; phải là role toàn cục hoặc cùng tổ chức với membership. */
  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId: string;

  /** Thời điểm gán role. */
  @CreateDateColumn({
    name: 'assigned_at',
    type: 'timestamptz',
  })
  assignedAt: Date;
}
