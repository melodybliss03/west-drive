import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers?: { authorization?: string } }>();
    const authHeader = request.headers?.authorization;

    if (!authHeader) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info?: { message?: string },
  ): TUser | null {
    if (err) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException(info?.message ?? 'Invalid token');
    }

    return user;
  }
}
