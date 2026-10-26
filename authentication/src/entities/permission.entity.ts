import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Quyền nguyên tử dạng code ổn định, ví dụ organization:member:invite. */
@Entity('permissions')
export class Permission {
  /** UUID của quyền. */
  @PrimaryColumn('uuid')
  id: string;

  /** Mã quyền ổn định, dùng kiểm tra authorization trong code. */
  @Column({ length: 100, unique: true })
  code: string;

  /** Mô tả hành động được cấp bởi quyền này. */
  @Column({ type: 'text', nullable: true })
  description: string | null;
}
