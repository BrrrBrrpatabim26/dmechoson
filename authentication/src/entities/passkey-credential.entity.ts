import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** Khóa công khai WebAuthn; private key không bao giờ lưu ở server. */
@Entity('passkey_credentials')
@Index('ix_passkey_identity', ['identityId'])
export class PasskeyCredential {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'identity_id', type: 'uuid' })
  identityId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    name: 'credential_id',
    type: 'bytea',
    unique: true,
  })
  credentialId: Buffer;

  @Column({ name: 'public_key', type: 'bytea' })
  publicKey: Buffer;

  /** Bộ đếm chống replay; cần xử lý theo chính sách authenticator trong service. */
  @Column({
    name: 'sign_count',
    type: 'bigint',
    default: 0,
  })
  signCount: string;

  @Column({ type: 'text', array: true, nullable: true })
  transports: string[] | null;

  @Column({ type: 'uuid', nullable: true })
  aaguid: string | null;

  @Column({
    name: 'backed_up',
    type: 'boolean',
    nullable: true,
  })
  backedUp: boolean | null;

  @Column({
    name: 'device_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  deviceName: string | null;

  @Column({
    name: 'last_used_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastUsedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}
