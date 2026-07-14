import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

interface SessionUser {
  id: string;
  role?: string;
}

interface AuthSession {
  user?: SessionUser;
}

interface AuthRequest extends Request {
  session?: AuthSession;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    return request.session?.user;
  },
);
