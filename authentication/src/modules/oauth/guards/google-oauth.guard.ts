import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthMethodDisabledException } from '../../../common/exceptions/auth.exceptions.js';

/**
 * Guard kích hoạt Google OAuth strategy.
 *
 * Chặn request (AUTH_METHOD_DISABLED) nếu:
 * 1. Phương thức 'google' chưa bật trong AUTH_ENABLED_METHODS, hoặc
 * 2. Chưa cấu hình GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.ensureConfigured();
    return super.canActivate(context) as Promise<boolean>;
  }

  protected ensureConfigured(): void {
    const enabled = this.configService.get<string[]>('auth.enabledMethods', []);
    if (!enabled.includes('*') && !enabled.includes('google')) {
      throw new AuthMethodDisabledException('google');
    }

    const clientId = this.configService.get<string>('oauth.google.clientId', '');
    const clientSecret = this.configService.get<string>('oauth.google.clientSecret', '');
    if (!clientId || !clientSecret) {
      throw new AuthMethodDisabledException('google');
    }
  }
}
