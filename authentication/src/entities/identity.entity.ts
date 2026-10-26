import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { UserEntity } from './user.entity.js';
import { AuthProvider } from './auth-provider.entity.js';
import { PasswordCredential } from './password-credential.entity.js';
import { OAuthToken } from './oauth-token.entity.js';

@Entity('identities')
@Unique('ux_identity_provider_subject', ['providerId', 'providerUserId'])
export class UserIdentity {
  @PrimaryColumn('uuid')
  id: string; // Khóa chính của identity

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: string; // FK -> users.id

  @ManyToOne(() => UserEntity, (user) => user.userIdentities, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserEntity>;

  @Column({
    name: 'provider_id',
    type: 'uuid',
  })
  providerId: string; // FK -> auth_providers.id

  @ManyToOne(() => AuthProvider, (provider) => provider.identities, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider: Relation<AuthProvider>;

  /** Mã tài khoản duy nhất do provider cấp (OAuth sub, username, email...). */
  @Column({
    name: 'provider_user_id',
    type: 'varchar',
    length: 255,
  })
  providerUserId: string;

  /** Email provider trả về chỉ để tham khảo, không tự dùng để gộp tài khoản. */
  @Column({ type: 'varchar', length: 320, nullable: true })
  email: string | null;

  /** Provider xác nhận email này hay chưa; null nếu provider không cung cấp. */
  @Column({
    name: 'email_verified',
    type: 'boolean',
    nullable: true,
  })
  emailVerified: boolean | null;

  // Thông tin bổ sung do identity provider cung cấp.
  // Chỉ giữ nếu nghiệp vụ thực sự cần lưu dữ liệu profile.
  @Column({
    type: 'jsonb',
    nullable: false,
    default: () => "'{}'::jsonb",
  })
  profile: Record<string, unknown>;

  /** Thời điểm đăng nhập gần nhất bằng identity này. */
  @Column({
    name: 'last_login_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastLoginAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;

  // Một identity có tối đa một bộ thông tin xác thực bằng mật khẩu.
  // Identity thuộc OAuth hoặc passkey có thể không có credential này.
  @OneToOne(() => PasswordCredential, (credential) => credential.identity)
  passwordCredential: Relation<PasswordCredential | null>;

  @OneToOne(() => OAuthToken, (token) => token.identity)

  oauthToken: Relation<OAuthToken | null>;
}
