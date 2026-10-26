import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Không gian tổ chức/tenant. Quyền truy cập cụ thể được cấp qua Membership. */
@Entity('organizations')
export class Organization {
  /** UUID của tổ chức. */
  @PrimaryColumn('uuid')
  id: string;

  /** Tên hiển thị của tổ chức. */
  @Column({ length: 150 })
  name: string;

  /** Định danh thân thiện dùng trong URL; cần chuẩn hóa chữ hoa/thường ở tầng dữ liệu. */
  @Column({ length: 150, unique: true })
  slug: string;

  /** Trạng thái tổ chức; ứng dụng nên chỉ cho phép các trạng thái đã định nghĩa. */
  @Column({ length: 20, default: 'active' })
  status: string;

  /** Thời điểm tạo tổ chức. */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  /** Thời điểm cập nhật tổ chức. */
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;

  /** Thời điểm xóa mềm; NULL nghĩa tổ chức chưa bị xóa mềm. */
  @Column({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date | null;
}
