import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** Một phương thức MFA đã hoặc đang được cấu hình cho người dùng. */
@Entity('mfa_factors')
@Index('ix_mfa_user', ['userId'])
export class MfaFactor {
  /** UUID của yếu tố MFA. */
  @PrimaryColumn('uuid')
  id: string;

  /** User sở hữu phương thức MFA này. */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** Loại phương thức: totp, sms, email hoặc passkey. */
  @Column({ length: 15 })
  type: string;

  /** Tên thân thiện để người dùng phân biệt các phương thức. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string | null;

  /** Bí mật TOTP phải mã hóa bằng KMS/app layer trước khi persist. */
  @Column({
    name: 'secret_enc',
    type: 'bytea',
    nullable: true,
  })
  secretEnc: Buffer | null;

  @Column({
    name: 'user_phone_id',
    type: 'uuid',
    nullable: true,
  })
  userPhoneId: string | null;

  /** Email đã xác minh được dùng làm factor khi type=email. */
  @Column({
    name: 'user_email_id',
    type: 'uuid',
    nullable: true,
  })
  userEmailId: string | null;

  /** Credential passkey dùng làm factor khi type=passkey. */
  @Column({
    name: 'passkey_credential_id',
    type: 'uuid',
    nullable: true,
  })
  passkeyCredentialId: string | null;

  /** Factor chỉ có hiệu lực sau khi được xác minh và bật. */
  @Column({ name: 'is_enabled', default: false })
  isEnabled: boolean;

  /** Thời điểm người dùng hoàn tất xác minh factor. */
  @Column({
    name: 'verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  verifiedAt: Date | null;

  /** Lần gần nhất factor này được dùng thành công. */
  @Column({
    name: 'last_used_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastUsedAt: Date | null;

  /** Thời điểm tạo cấu hình factor. */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}
