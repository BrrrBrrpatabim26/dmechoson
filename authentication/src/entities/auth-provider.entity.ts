import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import type { Relation } from 'typeorm';

import { UserIdentity } from './identity.entity.js';

// Kiểu dữ liệu cấu hình linh hoạt cho từng authentication provider
export interface AuthProviderConfig {
  scopes?: string[]; // Các quyền OAuth được yêu cầu
  issuer?: string | string[]; // Địa chỉ định danh bên phát hành token
  endpoints?: Record<string, string>; // Các endpoint như authorize, token, userinfo

  [key: string]: unknown; // Cho phép bổ sung cấu hình riêng cho từng provider
}

@Entity('auth_providers') // Ánh xạ entity với bảng auth_providers
export class AuthProvider {
  @PrimaryColumn('uuid')
  id: string; // Khóa chính của provider

  @Column({
    type: 'varchar',
    length: 50,
    unique: true, // Mỗi provider có mã code duy nhất
  })
  code: string; // Ví dụ: google, github, password, passkey

  @Column({
    type: 'varchar',
    length: 30,
  })
  kind: string; // Phân loại: password, oauth, otp, passkey

  @Column({
    type: 'varchar',
    length: 100,
    name: 'display_name', // Tên cột trong database
  })
  displayName: string; // Tên hiển thị, ví dụ: Google, GitHub

  @Column({
    name: 'is_enabled',
    type: 'boolean', // Cột bật/tắt phải dùng boolean, không dùng length
    default: true, // Mặc định provider được bật
  })
  isEnabled: boolean; // Cho phép hoặc ngăn sử dụng provider

  @Column({
    type: 'jsonb', // Lưu cấu hình dạng JSON trong PostgreSQL
    default: () => "'{}'::jsonb", // Mặc định là object JSON rỗng
  })
  config: AuthProviderConfig; // Cấu hình OAuth, OTP hoặc các loại provider khác

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz', // Thời điểm tạo, có thông tin múi giờ
  })
  createdAt: Date; // TypeORM tự quản lý thời điểm tạo bản ghi

  @OneToMany(
    () => UserIdentity,
    (identity) => identity.provider, // Trỏ về thuộc tính provider trong UserIdentity
  )
  identities: Relation<UserIdentity[]>; // Danh sách identity đang sử dụng provider này
}
