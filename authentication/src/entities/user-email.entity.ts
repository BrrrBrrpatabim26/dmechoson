import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from './user.entity.js';

@Entity('user_emails') // Tên bảng trong Database
export class UserEmail {
  /**
   * Khóa chính riêng của bảng user_emails (UUID v7 sinh từ service).
   */
  @PrimaryColumn('uuid')
  id: string;

  /**
   * Cột vật lý lưu Foreign Key (user_id) trỏ sang bảng users.
   * Khai báo riêng cột này để có thể query/gán trực tiếp email.userId mà không cần load cả object User.
   */
  @Column({ name: 'user_id' })
  userId: string;

  /**
   * Quan hệ N-1 phía sở hữu: nhiều email có thể thuộc một user.
   * - (user) => user.emails: trỏ tới danh sách emails trên UserEntity
   *   (KHÔNG ĐƯỢC trỏ vào user.id vì đó là chuỗi UUID).
   * - nullable: false: Bắt buộc bản ghi email này phải gắn với một User.
   * - onDelete: 'CASCADE': Xóa User bên bảng users thì dòng này tự động bị xóa theo.
   * - @JoinColumn({ name: 'user_id' }): Xác định bảng này chứa cột Foreign Key tên là 'user_id'.
   */
  @ManyToOne(() => UserEntity, (user) => user.emails, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserEntity>;

  // Địa chỉ email duy nhất trong hệ thống
  @Column({ length: 250, unique: true })
  email: string;

  // Email được xác thực khi có thời điểm xác minh; null nghĩa là chưa xác minh.
  @Column({
    name: 'verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  verifiedAt: Date | null;

  // Địa chỉ chính được dùng làm email liên hệ mặc định.
  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
  })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at' })

  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })

  updatedAt: Date;
}
