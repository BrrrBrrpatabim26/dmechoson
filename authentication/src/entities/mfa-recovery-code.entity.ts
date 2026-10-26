import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** Mã dự phòng dùng một lần khi người dùng không còn MFA chính. */
@Entity('mfa_recovery_codes')
@Index('ix_recovery_user', ['userId'])
export class MfaRecoveryCode {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** Chỉ lưu hash; mỗi mã cần được đánh dấu usedAt sau lần dùng thành công. */
  @Column({ name: 'code_hash', type: 'text' })
  codeHash: string;

  @Column({
    name: 'used_at',
    type: 'timestamptz',
    nullable: true,
  })
  usedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}
