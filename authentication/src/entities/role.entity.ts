import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Vai trò tổ chức (orgId có giá trị) hoặc vai trò toàn hệ thống (orgId null). */
@Entity('roles')
export class Role {
  /** UUID của role. */
  @PrimaryColumn('uuid')
  id: string;

  /** NULL biểu thị role toàn hệ thống; có giá trị là role thuộc tổ chức đó. */
  @Column({ name: 'org_id', type: 'uuid', nullable: true })
  orgId: string | null;

  /** Tên role, ví dụ Owner hoặc Member. */
  @Column({ length: 100 })
  name: string;

  /** Mô tả mục đích và phạm vi của role. */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Đánh dấu role do hệ thống quản lý, thường không cho phép sửa/xóa tùy ý. */
  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  /** Thời điểm tạo role. */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  /** Thời điểm cập nhật role. */
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
