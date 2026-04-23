import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Guards internal service-to-service endpoints by validating the
 * X-Internal-Secret header against the INTERNAL_SECRET env variable.
 */
@Injectable()
export class InternalSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('INTERNAL_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Internal secret is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers['x-internal-secret'];

    // Use constant-time comparison to prevent timing-based secret enumeration.
    const headerBuf = Buffer.from(String(header ?? ''));
    const secretBuf = Buffer.from(secret);
    if (
      headerBuf.length !== secretBuf.length ||
      !timingSafeEqual(headerBuf, secretBuf)
    ) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    return true;
  }
}
