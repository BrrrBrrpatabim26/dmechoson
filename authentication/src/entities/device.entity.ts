import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** Thiết bị từng dùng để đăng nhập; không nên xem fingerprint là định danh chắc chắn. */
@Entity('devices')
@Index('ix_devices_user', ['userId'])
export class Device {
  /** UUID do service cấp, định danh bản ghi thiết bị. */
  @PrimaryColumn('uuid')
  id: string;

  /** Chủ sở hữu thiết bị; tầng nghiệp vụ phải bảo đảm khớp user của session. */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** Tên dễ đọc do người dùng hoặc ứng dụng đặt, không dùng làm định danh. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string | null;

  /** Nền tảng/loại thiết bị, ví dụ web, ios, android. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  platform: string | null;

  /** User-Agent ghi nhận lúc thiết bị được nhìn thấy gần nhất. */
  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
  })
  userAgent: string | null;

  /** Chỉ là tín hiệu tin cậy; việc bật cần xác minh và chính sách ứng dụng. */
  @Column({ name: 'is_trusted', default: false })
  isTrusted: boolean;

  /** Lần đầu thiết bị xuất hiện; TypeORM gán lúc tạo. */
  @CreateDateColumn({
    name: 'first_seen_at',
    type: 'timestamptz',
  })
  firstSeenAt: Date;

  /** Cập nhật mỗi lần hoạt động nếu service thực hiện cập nhật trường này. */
  @Column({
    name: 'last_seen_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  lastSeenAt: Date;
}
