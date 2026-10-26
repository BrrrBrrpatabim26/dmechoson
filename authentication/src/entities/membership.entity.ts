import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Liên kết user với tổ chức; trạng thái invited chưa đồng nghĩa quyền truy cập. */
@Entity('memberships')
@Index('ux_membership_org_user', ['orgId', 'userId'], {
  unique: true,
})
@Index('ix_memberships_user', ['userId'])
export class Membership {
  /** UUID của quan hệ thành viên. */
  @PrimaryColumn('uuid')
  id: string;

  /** Tổ chức mà user tham gia. */
  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  /** User được mời hoặc tham gia tổ chức. */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** invited, active hoặc suspended; chỉ active được cấp quyền truy cập. */
  @Column({ length: 20, default: 'invited' })
  status: string;

  /** Người mời trong cùng tổ chức; cần constraint liên bảng ở migration. */
  @Column({
    name: 'invited_by',
    type: 'uuid',
    nullable: true,
  })
  invitedBy: string | null;

  /** Thời điểm lời mời được chấp nhận. */
  @Column({
    name: 'joined_at',
    type: 'timestamptz',
    nullable: true,
  })
  joinedAt: Date | null;

  /** Thời điểm tạo membership. */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  /** Thời điểm membership được cập nhật. */
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
