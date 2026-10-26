import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IPasswordHasher } from '../../core/interfaces/password-hasher.interface.js';
import { Argon2PasswordHasher } from './argon2-hasher.service.js';
import { BcryptPasswordHasher } from './bcrypt-hasher.service.js';

@Injectable()
export class PasswordHasherService implements IPasswordHasher {
  private readonly logger = new Logger(PasswordHasherService.name);
  private readonly hashers = new Map<string, IPasswordHasher>();
  private readonly defaultAlgorithm: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly argon2Hasher: Argon2PasswordHasher,
    private readonly bcryptHasher: BcryptPasswordHasher,
  ) {
    this.registerHasher(this.argon2Hasher);
    this.registerHasher(this.bcryptHasher);

    this.defaultAlgorithm = this.configService.get<string>('hash.defaultAlgorithm', 'argon2id');
    this.logger.log(`PasswordHasherService khởi tạo với thuật toán mặc định: [${this.defaultAlgorithm}]`);
  }

  get algorithm(): string {
    return this.defaultAlgorithm;
  }

  registerHasher(hasher: IPasswordHasher): void {
    this.hashers.set(hasher.algorithm.toLowerCase(), hasher);
  }

  async hash(plainText: string, algorithm?: string): Promise<string> {
    const targetAlgo = (algorithm || this.defaultAlgorithm).toLowerCase();
    const hasher = this.hashers.get(targetAlgo);

    if (!hasher) {
      throw new Error(`Thuật toán băm không được hỗ trợ: ${targetAlgo}`);
    }

    return hasher.hash(plainText);
  }

  async verify(plainText: string, hash: string, algorithmHint?: string): Promise<boolean> {
    if (algorithmHint) {
      const hasher = this.hashers.get(algorithmHint.toLowerCase());
      if (hasher) {
        return hasher.verify(plainText, hash);
      }
    }

    for (const hasher of this.hashers.values()) {
      if (hasher.supports(hash)) {
        return hasher.verify(plainText, hash);
      }
    }

    this.logger.warn(`Không nhận diện được thuật toán phù hợp cho chuỗi hash đã cho.`);
    return false;
  }

  supports(hash: string): boolean {
    for (const hasher of this.hashers.values()) {
      if (hasher.supports(hash)) {
        return true;
      }
    }
    return false;
  }

  needsRehash(hash: string, storedAlgorithm?: string): boolean {
    if (storedAlgorithm && storedAlgorithm.toLowerCase() !== this.defaultAlgorithm.toLowerCase()) {
      return true;
    }
    const defaultHasher = this.hashers.get(this.defaultAlgorithm.toLowerCase());
    return defaultHasher ? !defaultHasher.supports(hash) : false;
  }
}
