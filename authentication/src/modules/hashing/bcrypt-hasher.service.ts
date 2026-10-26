import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { BasePasswordHasher } from '../../core/abstracts/base-hasher.abstract.js';

@Injectable()
export class BcryptPasswordHasher extends BasePasswordHasher {
  private readonly saltRounds: number;

  constructor(private readonly configService: ConfigService) {
    super('bcrypt');
    this.saltRounds = this.configService.get<number>('hash.bcryptRounds', 12);
  }

  supports(hash: string): boolean {
    return (
      typeof hash === 'string' &&
      (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$'))
    );
  }

  protected async executeHash(plainText: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(plainText, salt);
  }

  protected async executeVerify(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
