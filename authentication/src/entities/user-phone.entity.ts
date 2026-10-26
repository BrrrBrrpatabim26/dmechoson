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

@Entity('user_phones')
export class UserPhoneNumber {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })

  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.phoneNumbers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserEntity>;

  @Column({ length: 16, name: 'phone_e164', unique: true })

  phoneNumber: string;

  // Thêm default: false để tránh lỗi khi không truyền vào lúc insert
  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  // Đổi thành Column bình thường, cho phép null khi chưa xác thực OTP
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'verified_at',
  })
  verifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })

  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })

  updatedAt: Date;
}
