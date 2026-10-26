import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Argon2PasswordHasher } from '../src/modules/hashing/argon2-hasher.service.js';
import { BcryptPasswordHasher } from '../src/modules/hashing/bcrypt-hasher.service.js';
import { PasswordHasherService } from '../src/modules/hashing/password-hasher.service.js';

describe('Password Hashing Polymorphism (Đa hình thuật toán băm)', () => {
  let configService: ConfigService;
  let argon2Hasher: Argon2PasswordHasher;
  let bcryptHasher: BcryptPasswordHasher;
  let hasherService: PasswordHasherService;

  beforeEach(() => {
    configService = new ConfigService({
      hash: {
        defaultAlgorithm: 'argon2id',
        argon2MemoryCost: 19456, // Giảm memory cost trong unit test để chạy nhanh
        argon2TimeCost: 2,
        argon2Parallelism: 1,
        bcryptRounds: 10,
      },
    });

    argon2Hasher = new Argon2PasswordHasher(configService);
    bcryptHasher = new BcryptPasswordHasher(configService);
    hasherService = new PasswordHasherService(configService, argon2Hasher, bcryptHasher);
  });

  it('Argon2PasswordHasher: băm và xác thực mật khẩu chính xác', async () => {
    const plain = 'StrongP@ssword2026';
    const hash = await argon2Hasher.hash(plain);

    expect(hash).toBeDefined();
    expect(argon2Hasher.supports(hash)).toBe(true);
    expect(await argon2Hasher.verify(plain, hash)).toBe(true);
    expect(await argon2Hasher.verify('WrongPassword', hash)).toBe(false);
  });

  it('BcryptPasswordHasher: băm và xác thực mật khẩu chính xác', async () => {
    const plain = 'AnotherStrongPassword!';
    const hash = await bcryptHasher.hash(plain);

    expect(hash).toBeDefined();
    expect(bcryptHasher.supports(hash)).toBe(true);
    expect(await bcryptHasher.verify(plain, hash)).toBe(true);
    expect(await bcryptHasher.verify('WrongPassword', hash)).toBe(false);
  });

  it('PasswordHasherService: tự động nhận diện và xác thực đa hình (Argon2 và Bcrypt)', async () => {
    const plain = 'UniversalPassword#123';

    // 1. Băm bằng Argon2
    const argonHash = await argon2Hasher.hash(plain);
    // 2. Băm bằng Bcrypt
    const bcryptHash = await bcryptHasher.hash(plain);

    // Xác thực đa hình qua PasswordHasherService không cần chỉ định thuật toán
    expect(await hasherService.verify(plain, argonHash)).toBe(true);
    expect(await hasherService.verify(plain, bcryptHash)).toBe(true);
    expect(await hasherService.verify('SaiMatKhau', argonHash)).toBe(false);
    expect(await hasherService.verify('SaiMatKhau', bcryptHash)).toBe(false);
  });

  it('PasswordHasherService: kiểm tra phát hiện mật khẩu cần nâng cấp thuật toán (Rehash)', async () => {
    const plain = 'OldBcryptPassword';
    const bcryptHash = await bcryptHasher.hash(plain);

    // Mặc định hệ thống là argon2id, nên hash bcrypt sẽ cần rehash
    expect(hasherService.needsRehash(bcryptHash, 'bcrypt')).toBe(true);

    const argonHash = await argon2Hasher.hash(plain);
    expect(hasherService.needsRehash(argonHash, 'argon2id')).toBe(false);
  });
});
