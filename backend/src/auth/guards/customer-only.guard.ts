import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUser } from '../interfaces/auth-user.interface';

const CUSTOMER_ROLE_NAMES = new Set(['CUSTOMER', 'CLIENT']);

function isCustomerOnlyUser(user: AuthUser): boolean {
  const roleNames = new Set(
    [user.role, ...(user.roles ?? [])]
      .filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
      .map((role) => role.trim().toUpperCase()),
  );

  if (roleNames.size === 0) {
    return false;
  }

  for (const roleName of roleNames) {
    if (!CUSTOMER_ROLE_NAMES.has(roleName)) {
      return false;
    }
  }

  return true;
}

@Injectable()
export class CustomerOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!isCustomerOnlyUser(user)) {
      throw new ForbiddenException('This endpoint is restricted to customer accounts');
    }

    return true;
  }
}

@Injectable()
export class CustomerIfAuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      return true;
    }

    if (!isCustomerOnlyUser(user)) {
      throw new ForbiddenException('Backoffice accounts cannot perform customer actions');
    }

    return true;
  }
}
