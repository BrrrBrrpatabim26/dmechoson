import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { TokenExpiredException, TokenInvalidException } from '../exceptions/auth.exceptions.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (info?.message === 'jwt expired') {
      throw new TokenExpiredException();
    }

    if (err || !user) {
      throw err || new TokenInvalidException('Yêu cầu Access Token hợp lệ trong header Authorization: Bearer <token>');
    }

    return user;
  }
}
