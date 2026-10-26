export interface GeneratedTokenResult {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Interface cho chiến lược sinh & xác thực mã/token (Numeric OTP, Magic Link...).
 */
export interface IOtpStrategy {
  readonly type: 'otp' | 'magic_link';

  /**
   * Sinh mã ngẫu nhiên bảo mật kèm chuỗi băm SHA-256 và thời hạn.
   *
   * @param expiryMinutes Thời hạn của mã (phút)
   */
  generate(expiryMinutes?: number): GeneratedTokenResult;

  /**
   * Băm chuỗi mã thô sang SHA-256 hex string.
   */
  hashToken(rawToken: string): string;

  /**
   * So sánh mã thô với chuỗi băm đã lưu (kháng timing attack).
   */
  verify(rawToken: string, tokenHash: string): boolean;
}
