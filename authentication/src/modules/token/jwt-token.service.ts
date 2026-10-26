import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as crypto from 'crypto';
import type {
  ITokenService,
  TokenPair,
  TokenPayload,
} from '../../core/interfaces/token-service.interface.js';
import { TokenExpiredException, TokenInvalidException } from '../../common/exceptions/auth.exceptions.js';
import { parseDurationToSeconds } from '../../common/utils/duration.util.js';

/** Algorithm ký/verify duy nhất được phép — pin chặt chống `alg` confusion (defense-in-depth). */
const JWT_ALGORITHM = 'HS256';

@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // JWT_SECRET là cấu hình bắt buộc (đã validate ở ConfigModule).
    // getOrThrow -> dừng khởi động nếu thiếu, không che bằng secret cứng (mục 5.2/5.4).
    this.jwtSecret = this.configService.getOrThrow<string>('jwt.secret');
    this.jwtExpiresIn = this.configService.get<string>('jwt.expiresIn', '15m');
  }

  generateRawRefreshToken(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  hashRefreshToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  async generateAccessToken(payload: TokenPayload): Promise<string> {
    const signOptions: JwtSignOptions = {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn as any,
      algorithm: JWT_ALGORITHM,
    };
    return this.jwtService.signAsync(payload, signOptions);
  }

  async generateTokenPair(payload: TokenPayload, sessionId: string): Promise<TokenPair> {
    const tokenPayload: TokenPayload = {
      ...payload,
      sessionId,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };

    const accessToken = await this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRawRefreshToken();
    const expiresInSeconds = parseDurationToSeconds(this.jwtExpiresIn, 900);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      tokenType: 'Bearer',
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.jwtSecret,
        algorithms: [JWT_ALGORITHM],
      });
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new TokenExpiredException();
      }
      throw new TokenInvalidException('Access Token không hợp lệ');
    }
  }
}
