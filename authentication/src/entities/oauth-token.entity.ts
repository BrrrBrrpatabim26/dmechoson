import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';

import { UserIdentity } from './identity.entity.js';

@Entity('oauth_tokens')
export class OAuthToken {
  // Khóa chính đồng thời là khóa ngoại tham chiếu identities.id.
  // Mỗi identity chỉ có tối đa một bản ghi OAuth token.
  @PrimaryColumn('uuid', { name: 'identity_id' })
  identityId: string;

  // Quan hệ 1-1 với UserIdentity.
  // Khi identity bị xóa, bản ghi OAuth token tương ứng cũng bị xóa.
  @OneToOne(() => UserIdentity, (identity) => identity.oauthToken, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'identity_id' })
  identity: Relation<UserIdentity>;

  // Access token đã mã hóa, lưu dưới dạng nhị phân PostgreSQL BYTEA.
  // Buffer là kiểu dữ liệu nhị phân tương ứng trong Node.js.
  @Column({ name: 'access_token_enc', type: 'bytea' })
  accessTokenEnc: Buffer;

  // Refresh token đã mã hóa.
  // Có thể null nếu nhà cung cấp OAuth không cấp refresh token
  // hoặc ứng dụng không cần lưu refresh token.
  @Column({
    name: 'refresh_token_enc',
    type: 'bytea',
    nullable: true,
  })
  refreshTokenEnc: Buffer | null;

  // Danh sách quyền OAuth mà access token được cấp.
  // PostgreSQL lưu dưới dạng mảng TEXT, ví dụ: {"openid","profile"}.
  // Mặc định là mảng rỗng.
  @Column({
    type: 'text',
    array: true,
    default: () => 'ARRAY[]::text[]',
  })
  scopes: string[];

  // Thời điểm access token hết hạn.
  // Null nếu không có thông tin hết hạn cụ thể.
  @Column({
    name: 'expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  expiresAt: Date | null;

  // Thời điểm bản ghi được cập nhật gần nhất.
  // TypeORM tự quản lý giá trị khi bản ghi được cập nhật.
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
