import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { UserEmail } from './user-email.entity.js';
import { UserPhoneNumber } from './user-phone.entity.js';
import { UserIdentity } from './identity.entity.js';

@Entity('users') // Ä‚Ânh xĂ¡ÂºÂ¡ class UserEntity vĂ¡Â»â€ºi bĂ¡ÂºÂ£ng users trong database
export class UserEntity {
  /**
   * KhÄ‚Â³a chÄ‚Â­nh UUID v7 do service tĂ¡ÂºÂ¡o vÄ‚Â  truyĂ¡Â»Ân vÄ‚Â o.
   * PrimaryColumn khÄ‚Â´ng tĂ¡Â»Â± sinh giÄ‚Â¡ trĂ¡Â»â€¹ ID.
   */
  @PrimaryColumn('uuid')
  id: string;

  /**
   * TÄ‚Âªn ngĂ†Â°Ă¡Â»Âi dÄ‚Â¹ng.
   * Ä‚Ânh xĂ¡ÂºÂ¡ thuĂ¡Â»â„¢c tÄ‚Â­nh userName sang cĂ¡Â»â„¢t user_name.
   * Ă„ÂĂ¡Â»â„¢ dÄ‚Â i tĂ¡Â»â€˜i Ă„â€˜a: 250 kÄ‚Â½ tĂ¡Â»Â±.
   */
  @Column({
    length: 250,
    name: 'user_name',
  })
  userName: string;

  /** Tên đăng nhập duy nhất, có thể bỏ trống khi tài khoản chỉ dùng email. */
  @Column({
    type: 'varchar',
    length: 100,
    name: 'username',
    nullable: true,
    unique: true,
  })
  username: string | null;

  /**
   * URL Ă¡ÂºÂ£nh Ă„â€˜Ă¡ÂºÂ¡i diĂ¡Â»â€¡n.
   * nullable: true cho phÄ‚Â©p cĂ¡Â»â„¢t nhĂ¡ÂºÂ­n giÄ‚Â¡ trĂ¡Â»â€¹ NULL trong database.
   */
  @Column({
    type: 'varchar',
    length: 1000,
    name: 'avatar_url',
    nullable: true,
  })
  avatarUrl: string | null;

  /**
   * NgÄ‚Â´n ngĂ¡Â»Â¯ Ă†Â°u tiÄ‚Âªn cĂ¡Â»Â§a ngĂ†Â°Ă¡Â»Âi dÄ‚Â¹ng.
   * VÄ‚Â­ dĂ¡Â»Â¥: vi, en, ja.
   */
  @Column({ length: 10 })
  locale: string;

  /**
   * MÄ‚Âºi giĂ¡Â»Â cĂ¡Â»Â§a ngĂ†Â°Ă¡Â»Âi dÄ‚Â¹ng.
   * VÄ‚Â­ dĂ¡Â»Â¥: Asia/Ho_Chi_Minh, UTC.
   */
  @Column({ length: 50 })
  timezone: string;

  /**
   * TrĂ¡ÂºÂ¡ng thÄ‚Â¡i tÄ‚Â i khoĂ¡ÂºÂ£n.
   * VÄ‚Â­ dĂ¡Â»Â¥: active, suspended, pending.
   * NÄ‚Âªn dÄ‚Â¹ng enum hoĂ¡ÂºÂ·c kiĂ¡Â»Æ’m soÄ‚Â¡t giÄ‚Â¡ trĂ¡Â»â€¹ hĂ¡Â»Â£p lĂ¡Â»â€¡ Ă¡Â»Å¸ tĂ¡ÂºÂ§ng Ă¡Â»Â©ng dĂ¡Â»Â¥ng.
   */
  @Column({ length: 100 })
  status: string;

  /**
   * ThĂ¡Â»Âi Ă„â€˜iĂ¡Â»Æ’m Ă„â€˜Ă„Æ’ng nhĂ¡ÂºÂ­p gĂ¡ÂºÂ§n nhĂ¡ÂºÂ¥t.
   * NULL nĂ¡ÂºÂ¿u ngĂ†Â°Ă¡Â»Âi dÄ‚Â¹ng chĂ†Â°a Ă„â€˜Ă„Æ’ng nhĂ¡ÂºÂ­p lĂ¡ÂºÂ§n nÄ‚Â o.
   */
  @Column({
    type: 'timestamptz',
    name: 'last_login_at',
    nullable: true,
  })
  lastLoginAt: Date | null;

  /**
   * ThĂ¡Â»Âi Ă„â€˜iĂ¡Â»Æ’m tĂ¡ÂºÂ¡o bĂ¡ÂºÂ£n ghi.
   * TypeORM tĂ¡Â»Â± gÄ‚Â¡n khi INSERT.
   */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  /**
   * ThĂ¡Â»Âi Ă„â€˜iĂ¡Â»Æ’m cĂ¡ÂºÂ­p nhĂ¡ÂºÂ­t bĂ¡ÂºÂ£n ghi gĂ¡ÂºÂ§n nhĂ¡ÂºÂ¥t.
   * TypeORM tĂ¡Â»Â± cĂ¡ÂºÂ­p nhĂ¡ÂºÂ­t khi bĂ¡ÂºÂ£n ghi Ă„â€˜Ă†Â°Ă¡Â»Â£c INSERT/UPDATE phÄ‚Â¹ hĂ¡Â»Â£p.
   */
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;

  /**
   * ThĂ¡Â»Âi Ă„â€˜iĂ¡Â»Æ’m xÄ‚Â³a mĂ¡Â»Âm.
   * NULL nghĂ„Â©a lÄ‚Â  bĂ¡ÂºÂ£n ghi chĂ†Â°a bĂ¡Â»â€¹ xÄ‚Â³a mĂ¡Â»Âm.
   * Khi sĂ¡Â»Â­ dĂ¡Â»Â¥ng repository.softDelete(), TypeORM cĂ¡ÂºÂ­p nhĂ¡ÂºÂ­t cĂ¡Â»â„¢t nÄ‚Â y.
   */
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
  })
  deletedAt: Date | null;

  /**
   * MĂ¡Â»â„¢t user cÄ‚Â³ thĂ¡Â»Æ’ sĂ¡Â»Å¸ hĂ¡Â»Â¯u nhiĂ¡Â»Âu Ă„â€˜Ă¡Â»â€¹a chĂ¡Â»â€° email (vÄ‚Â­ dĂ¡Â»Â¥ email chÄ‚Â­nh vÄ‚Â  phĂ¡Â»Â¥).
   */
  @OneToMany(() => UserEmail, (email) => email.user)
  emails: Relation<UserEmail[]>;

  /**
   * Quan hĂ¡Â»â€¡ 1-N vĂ¡Â»â€ºi UserPhoneNumber.
   *
   * MĂ¡Â»â„¢t user cÄ‚Â³ thĂ¡Â»Æ’ cÄ‚Â³ nhiĂ¡Â»Âu sĂ¡Â»â€˜ Ă„â€˜iĂ¡Â»â€¡n thoĂ¡ÂºÂ¡i.
   * phoneNumber.user lÄ‚Â  thuĂ¡Â»â„¢c tÄ‚Â­nh quan hĂ¡Â»â€¡ Ă¡Â»Å¸ phÄ‚Â­a UserPhoneNumber.
   * KhÄ‚Â³a ngoĂ¡ÂºÂ¡i nĂ¡ÂºÂ±m trong bĂ¡ÂºÂ£ng user_phone_numbers.
   */
  @OneToMany(() => UserPhoneNumber, (phoneNumber) => phoneNumber.user)
  phoneNumbers: Relation<UserPhoneNumber[]>;

  /**
   * Quan hĂ¡Â»â€¡ 1-N vĂ¡Â»â€ºi UserIdentity.
   *
   * MĂ¡Â»â„¢t user cÄ‚Â³ thĂ¡Â»Æ’ cÄ‚Â³ nhiĂ¡Â»Âu identity:
   * - Google
   * - GitHub
   * - Password
   * - Passkey
   *
   * userIdentity.user lÄ‚Â  thuĂ¡Â»â„¢c tÄ‚Â­nh quan hĂ¡Â»â€¡ Ă¡Â»Å¸ UserIdentity.
   * KhÄ‚Â³a ngoĂ¡ÂºÂ¡i user_id nĂ¡ÂºÂ±m trong bĂ¡ÂºÂ£ng identities.
   */
  @OneToMany(() => UserIdentity, (userIdentity) => userIdentity.user)
  userIdentities: Relation<UserIdentity[]>;
}
