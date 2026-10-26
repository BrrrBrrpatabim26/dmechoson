/**
 * Payload chứa trong Access Token JWT mang theo thông tin định danh và phân quyền.
 */
export interface TokenPayload {
  sub: string; // User ID (UUID v7)
  email: string;
  userName?: string;
  sessionId?: string;
  orgId?: string | null;
  roles: string[]; // Danh sách các vai trò (ví dụ: ['USER', 'ADMIN'])
  permissions: string[]; // Danh sách quyền nguyên tử (ví dụ: ['user:profile:read', 'user:profile:update'])
  [key: string]: unknown;
}

/**
 * Cặp token trả về sau khi đăng nhập hoặc xoay vòng token.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Thời gian sống của Access Token tính bằng giây
  tokenType: string; // Mặc định: 'Bearer'
}

/**
 * Interface quản lý Token (JWT và Refresh Token).
 */
export interface ITokenService {
  generateTokenPair(payload: TokenPayload, sessionId: string): Promise<TokenPair>;

  generateAccessToken(payload: TokenPayload): Promise<string>;

  verifyAccessToken(token: string): Promise<TokenPayload>;

  hashRefreshToken(rawToken: string): string;

  generateRawRefreshToken(): string;
}
