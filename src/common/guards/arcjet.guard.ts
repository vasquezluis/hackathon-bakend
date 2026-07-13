import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ARCJET } from '@arcjet/nest';
import type { ArcjetNest } from '@arcjet/nest';
import type { Request } from 'express';

@Injectable()
export class ArcjetGuard implements CanActivate {
  constructor(@Inject(ARCJET) private readonly arcjet: ArcjetNest) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const decision = await this.arcjet.protect(request);

    if (decision.isErrored()) {
      console.error('Arcjet protect error', decision.id);
      return true;
    }

    if (!decision.isDenied()) {
      return true;
    }

    if (decision.reason.isRateLimit()) {
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    throw new ForbiddenException('Forbidden');
  }
}
