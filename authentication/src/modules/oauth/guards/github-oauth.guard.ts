import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthMethodDisabledException } from '../../../common/exceptions/auth.exceptions.js';

/**
 * Guard kích hoạt GitHub OAuth strategy (chặn tương tự GoogleOAuthGuard).
 */
@Injectable()
export class GitHubOAuthGuard extends AuthGuard('github') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.ensureConfigured();
    return super.canActivate(context) as Promise<boolean>;
  }

  protected ensureConfigured(): void {
    const enabled = this.configService.get<string[]>('auth.enabledMethods', []);
    if (!enabled.includes('*') && !enabled.includes('github')) {
      throw new AuthMethodDisabledException('github');
    }

    const clientId = this.configService.get<string>('oauth.github.clientId', '');
    const clientSecret = this.configService.get<string>('oauth.github.clientSecret', '');
    if (!clientId || !clientSecret) {
      throw new AuthMethodDisabledException('github');
    }
  }
}
