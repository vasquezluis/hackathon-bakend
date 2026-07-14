import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ADMIN_KEY } from '../decorators/admin.decorator';

interface SessionUser {
  role?: string;
}

interface AuthSession {
  user?: SessionUser;
}

interface AuthRequest extends Request {
  session?: AuthSession;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isAdmin = this.reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isAdmin) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (!request.session?.user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (request.session.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
