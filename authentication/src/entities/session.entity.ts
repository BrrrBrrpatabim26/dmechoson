import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** Phiên đăng nhập; token phiên nên được thu hồi khi đăng xuất hoặc có rủi ro. */
@Entity('sessions')
@Index('ix_sessions_user_active', ['userId'], {
  where: 'revoked_at IS NULL',
})
export class Session {
  /** UUID phiên đăng nhập do service cấp. */
  @PrimaryColumn('uuid')
  id: string;

  /** Tài khoản sở hữu phiên. */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** Identity dùng để đăng nhập; null nếu identity đã bị gỡ. */
  @Column({
    name: 'identity_id',
    type: 'uuid',
    nullable: true,
  })
  identityId: string | null;

  /** Thiết bị gắn với phiên, nếu nhận diện được. */
  @Column({
    name: 'device_id',
    type: 'uuid',
    nullable: true,
  })
  deviceId: string | null;

  /** Tổ chức đang được chọn; service phải kiểm tra user còn membership active. */
  @Column({
    name: 'active_org_id',
    type: 'uuid',
    nullable: true,
  })
  activeOrgId: string | null;

  /** Thời điểm MFA được thỏa mãn trong phiên hiện tại. */
  @Column({
    name: 'mfa_verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  mfaVerifiedAt: Date | null;

  /** IP nguồn của phiên tại lúc đăng nhập. */
  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  /** User-Agent lúc tạo phiên. */
  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
  })
  userAgent: string | null;

  /** Thời điểm tạo phiên. */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  /** Hoạt động gần nhất của phiên. */
  @Column({
    name: 'last_seen_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  lastSeenAt: Date;

  /** Sau thời điểm này phiên không còn hợp lệ. */
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  /** NULL khi phiên chưa bị thu hồi. */
  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt: Date | null;
}
