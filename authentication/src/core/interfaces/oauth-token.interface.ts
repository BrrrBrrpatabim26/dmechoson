import { OAuthToken } from '../../entities/oauth-token.entity.js';

export interface OAuthTokenInput {
  identityId: string;
  accessToken: string;
  refreshToken?: string | null;
  scopes?: string[];
  expiresAt?: Date | null;
}

/**
 * Repository lưu trữ token OAuth của nhà cung cấp bên thứ ba (Google/GitHub).
 * Token được mã hóa AES-256-GCM trước khi persist, không bao giờ lưu dạng thô.
 */
export interface IOAuthTokenRepository {
  upsert(input: OAuthTokenInput): Promise<OAuthToken>;
}
