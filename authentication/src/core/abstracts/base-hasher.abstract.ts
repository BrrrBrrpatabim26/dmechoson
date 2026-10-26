import { Logger } from '@nestjs/common';
import type { IPasswordHasher } from '../interfaces/password-hasher.interface.js';

/**
 * Lớp trừu tượng BasePasswordHasher (Template Method Pattern).
 *
 * Chỉ chứa các phương thức trừu tượng và phương thức mẫu xử lý chung.
 */
export abstract class BasePasswordHasher implements IPasswordHasher {
  protected readonly logger: Logger;

  constructor(public readonly algorithm: string) {
    this.logger = new Logger(this.constructor.name);
  }

  async hash(plainText: string): Promise<string> {
    this.validatePassword(plainText);
    const startTime = Date.now();
    const result = await this.executeHash(plainText);
    const duration = Date.now() - startTime;
    this.logger.debug(`Băm mật khẩu bằng thuật toán [${this.algorithm}] mất ${duration}ms`);
    return result;
  }

  async verify(plainText: string, hash: string): Promise<boolean> {
    if (!plainText || !hash) {
      return false;
    }
    try {
      return await this.executeVerify(plainText, hash);
    } catch (error) {
      this.logger.warn(`Lỗi verify với thuật toán [${this.algorithm}]: ${(error as Error).message}`);
      return false;
    }
  }

  abstract supports(hash: string): boolean;
  protected abstract executeHash(plainText: string): Promise<string>;
  protected abstract executeVerify(plainText: string, hash: string): Promise<boolean>;

  protected validatePassword(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new Error('Mật khẩu không được để trống và phải là chuỗi ký tự');
    }
    if (password.length > 256) {
      throw new Error('Mật khẩu vượt quá độ dài tối đa cho phép (256 ký tự)');
    }
  }
}
