import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** Refresh token lưu hash; parentId biểu diễn chuỗi rotation trong cùng session. */
@Entity('refresh_tokens')
@Index('ix_refresh_session', ['sessionId'])
export class RefreshToken {
  /** UUID của bản ghi refresh token. */
  @PrimaryColumn('uuid')
  id: string;

  /** Phiên sở hữu token; token không thể dùng ngoài phiên này. */
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  /** Token tiền nhiệm trong chuỗi rotation; null với token đầu tiên. */
  @Column({
    name: 'parent_id',
    type: 'uuid',
    nullable: true,
  })
  parentId: string | null;

  /** Hash token để so sánh; token gốc chỉ trả cho client một lần. */
  @Column({
    name: 'token_hash',
    type: 'text',
    unique: true,
  })
  tokenHash: string;

  /** Hạn dùng của token. */
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  /** Nếu token đã dùng lại sau rotation, service có thể thu hồi cả phiên. */
  @Column({
    name: 'used_at',
    type: 'timestamptz',
    nullable: true,
  })
  usedAt: Date | null;

  /** NULL khi token chưa bị thu hồi riêng. */
  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt: Date | null;

  /** Thời điểm tạo token. */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}
