import * as crypto from 'crypto';
import type {
  GeneratedTokenResult,
  IOtpStrategy,
} from '../interfaces/otp-strategy.interface.js';

export abstract class BaseOtpStrategy implements IOtpStrategy {
  constructor(readonly type: 'otp' | 'magic_link') {}

  abstract generate(expiryMinutes?: number): GeneratedTokenResult;

  hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  verify(rawToken: string, tokenHash: string): boolean {
    const computedHash = this.hashToken(rawToken);
    const bufA = Buffer.from(computedHash, 'utf8');
    const bufB = Buffer.from(tokenHash, 'utf8');

    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
