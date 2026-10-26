import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** OTP hoặc magic link dùng cho đăng ký, đăng nhập, xác minh và khôi phục. */
@Entity('verification_tokens')
@Index('ix_verif_target', ['target', 'purpose'])
@Index('ix_verif_expires', ['expiresAt'])
@Index('ix_verif_token_hash', ['tokenHash'])
export class VerificationToken {
  @PrimaryColumn('uuid')
  id: string;

  /** Có thể null khi người dùng chưa hoàn tất đăng ký. */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ length: 30 })
  purpose: string;

  @Column({ length: 10 })
  channel: string;

  @Column({ length: 255 })
  target: string;

  @Column({ name: 'token_type', length: 15 })
  tokenType: string;

  /** Chỉ lưu hash của mã bí mật, không lưu OTP/magic link dạng rõ. */
  @Column({ name: 'token_hash', type: 'text' })
  tokenHash: string;

  @Column({ type: 'smallint', default: 0 })
  attempts: number;

  @Column({
    name: 'max_attempts',
    type: 'smallint',
    default: 5,
  })
  maxAttempts: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({
    name: 'consumed_at',
    type: 'timestamptz',
    nullable: true,
  })
  consumedAt: Date | null;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}
