import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** Nhật ký sự kiện auth; FK cố ý lỏng để giữ log sau khi xóa tài khoản. */
@Entity('login_audit_logs')
@Index('ix_audit_user_time', ['userId', 'createdAt'])
@Index('ix_audit_event_time', ['eventType', 'createdAt'])
export class LoginAuditLog {
  /** UUID của sự kiện audit. */
  @PrimaryColumn('uuid')
  id: string;

  /** ID tham chiếu mềm để giữ lịch sử kể cả khi user bị xóa. */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  /** Identity liên quan; không tạo FK để tránh xóa log theo identity. */
  @Column({
    name: 'identity_id',
    type: 'uuid',
    nullable: true,
  })
  identityId: string | null;

  /** Provider liên quan; tham chiếu mềm, có thể null nếu chưa xác định. */
  @Column({
    name: 'provider_id',
    type: 'uuid',
    nullable: true,
  })
  providerId: string | null;

  /** Tên sự kiện như login_success, login_failed, password_reset. */
  @Column({ name: 'event_type', length: 40 })
  eventType: string;

  /** Kết quả thành công/thất bại của sự kiện. */
  @Column({ type: 'boolean' })
  success: boolean;

  /** Địa chỉ IP nguồn nếu thu thập được. */
  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  /** User-Agent của yêu cầu phát sinh sự kiện. */
  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
  })
  userAgent: string | null;

  /** Thuộc tính bổ sung có cấu trúc; không ghi secret hoặc token dạng rõ. */
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  /** Thời điểm phát sinh, dùng để truy vấn/phân vùng log. */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}
