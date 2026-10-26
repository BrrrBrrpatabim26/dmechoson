// 1-1 user identity (local/home)

import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import type { Relation } from 'typeorm';

import { UserIdentity } from './identity.entity.js';

@Entity('password_credentials')
export class PasswordCredential {
  // PK đồng thời là FK đến identities.id.
  // Mỗi identity có tối đa một password credential.
  @PrimaryColumn('uuid', { name: 'identity_id' })
  identityId: string;

  @OneToOne(() => UserIdentity, (identity) => identity.passwordCredential, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'identity_id' })
  identity: Relation<UserIdentity>;

  // Hash mật khẩu, không lưu mật khẩu gốc.
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 1000,
  })
  passwordHash: string;

  // Thuật toán dùng để tạo hash.
  @Column({
    name: 'hash_algorithm',
    type: 'varchar',
    length: 50,
    default: 'argon2id',
  })
  hashAlgorithm: string;

  // Chỉ cập nhật khi mật khẩu thực sự thay đổi.
  @Column({
    name: 'password_changed_at',
    type: 'timestamptz',
    nullable: true,
  })
  passwordChangedAt: Date | null;

  // Buộc người dùng đổi mật khẩu ở lần đăng nhập tiếp theo.
  @Column({
    name: 'must_change',
    type: 'boolean',
    default: false,
  })
  mustChange: boolean;

  // Số lần xác thực mật khẩu thất bại liên tiếp.
  @Column({
    name: 'failed_attempts',
    type: 'integer',
    default: 0,
  })
  failedAttempts: number;

  // Thời điểm hết khóa; NULL nghĩa là không bị khóa theo thời hạn này.
  @Column({
    name: 'locked_until',
    type: 'timestamptz',
    nullable: true,
  })
  lockedUntil: Date | null;
}
