import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { BaseOtpStrategy } from '../../../core/abstracts/base-otp-strategy.abstract.js';
import type { GeneratedTokenResult } from '../../../core/interfaces/otp-strategy.interface.js';

/**
 * Chiến lược sinh mã Magic Link Token (Cryptographic URL Token Strategy).
 *
 * Sinh 32 bytes ngẫu nhiên mã hóa Base64URL, có entropy 256-bit kháng brute-force.
 * Thời hạn mặc định: 15 phút.
 */
@Injectable()
export class MagicLinkStrategy extends BaseOtpStrategy {
  constructor() {
    super('magic_link');
  }

  generate(expiryMinutes: number = 15): GeneratedTokenResult {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    return {
      rawToken,
      tokenHash,
      expiresAt,
    };
  }
}
