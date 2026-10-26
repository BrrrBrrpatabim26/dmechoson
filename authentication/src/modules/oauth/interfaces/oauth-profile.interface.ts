/**
 * Hình dạng chuẩn hóa profile trả về từ các OAuth provider (Google, GitHub...).
 * Giúp tầng service không phụ thuộc vào cấu trúc raw profile riêng của từng provider.
 */
export interface OAuthProfile {
  /** Provider danh danh tính: 'google' | 'github'. */
  provider: string;
  /** Định danh duy nhất do provider cấp (Google sub, GitHub id). */
  providerUserId: string;
  /** Email provider trả về (có thể null với một số provider). */
  email: string | null;
  /** Provider có xác nhận email đã verified hay không. */
  emailVerified: boolean;
  /** Tên hiển thị. */
  displayName: string | null;
  /** URL avatar. */
  avatarUrl: string | null;
  /** Access token của provider (nếu có) để lưu vào oauth_tokens. */
  accessToken?: string;
  /** Refresh token của provider (nếu có). */
  refreshToken?: string;
  /** Thời hạn access token provider (giây). */
  expiresIn?: number;
  /** Danh sách scope OAuth. */
  scopes?: string[];
}
