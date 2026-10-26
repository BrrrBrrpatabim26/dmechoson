/**
 * Interface định nghĩa hợp đồng cho các thuật toán băm mật khẩu.
 *
 * Mọi thuật toán băm (Argon2id, Bcrypt, Scrypt...) đều phải tuân thủ interface này
 * để phục vụ thiết kế đa hình (Polymorphism) và dễ dàng thay thế trong tương lai.
 */
export interface IPasswordHasher {
  readonly algorithm: string;

  hash(plainText: string): Promise<string>;

  verify(plainText: string, hash: string): Promise<boolean>;

  supports(hash: string): boolean;
}
