import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { BaseOtpStrategy } from '../../../core/abstracts/base-otp-strategy.abstract.js';
import type { GeneratedTokenResult } from '../../../core/interfaces/otp-strategy.interface.js';

/**
 * Chiến lược sinh mã OTP dạng số (Numeric OTP Strategy).
 *
 * Sinh 6 chữ số ngẫu nhiên an toàn bằng crypto.randomInt (100000 - 999999).
 * Thời hạn mặc định: 5 phút.
 */
@Injectable()
export class NumericOtpStrategy extends BaseOtpStrategy {
  constructor() {
    super('otp');
  }

  generate(expiryMinutes: number = 5): GeneratedTokenResult {
    // Sinh số ngẫu nhiên từ 100000 đến 999999
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = this.hashToken(rawOtp);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    return {
      rawToken: rawOtp,
      tokenHash,
      expiresAt,
    };
  }
}
