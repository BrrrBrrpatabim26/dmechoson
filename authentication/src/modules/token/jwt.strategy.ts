import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { TokenPayload } from '../../core/interfaces/token-service.interface.js';
import { TokenInvalidException } from '../../common/exceptions/auth.exceptions.js';
import { SessionRevocationService } from './session-revocation.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    // Optional để unit test khởi tạo strategy trực tiếp không cần deny-list.
    @Optional() private readonly revocation?: SessionRevocationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
      // Pin thuật toán duy nhất — chống `alg` confusion (defense-in-depth).
      algorithms: ['HS256'],
    });
  }

  async validate(payload: TokenPayload): Promise<TokenPayload> {
    if (!payload || !payload.sub) {
      throw new TokenInvalidException('Token không hợp lệ hoặc thiếu định danh người dùng');
    }

    // S4: phiên bị thu hồi (signout/revoke/reuse-detection) phải bị từ chối ngay,
    // không chờ access token hết hạn tự nhiên.
    if (this.revocation && payload.sessionId && (await this.revocation.isRevoked(payload.sessionId))) {
      throw new TokenInvalidException('Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.');
    }

    return payload;
  }
}
