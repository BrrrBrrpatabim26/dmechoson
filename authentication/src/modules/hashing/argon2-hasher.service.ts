import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { BasePasswordHasher } from '../../core/abstracts/base-hasher.abstract.js';

@Injectable()
export class Argon2PasswordHasher extends BasePasswordHasher {
  private readonly memoryCost: number;
  private readonly timeCost: number;
  private readonly parallelism: number;

  constructor(private readonly configService: ConfigService) {
    super('argon2id');
    this.memoryCost = this.configService.get<number>('hash.argon2MemoryCost', 65536);
    this.timeCost = this.configService.get<number>('hash.argon2TimeCost', 3);
    this.parallelism = this.configService.get<number>('hash.argon2Parallelism', 1);
  }

  supports(hash: string): boolean {
    return typeof hash === 'string' && hash.startsWith('$argon2');
  }

  protected async executeHash(plainText: string): Promise<string> {
    return argon2.hash(plainText, {
      type: argon2.argon2id,
      memoryCost: this.memoryCost,
      timeCost: this.timeCost,
      parallelism: this.parallelism,
    });
  }

  protected async executeVerify(plainText: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plainText);
  }
}
