import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CorrelationIdService } from './correlation-id.service';

@Injectable()
export class CorrelationLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CorrelationLoggingInterceptor.name);

  constructor(private readonly correlationIdService: CorrelationIdService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const now = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              message: 'http.request.completed',
              correlationId: this.correlationIdService.getCorrelationId(),
              method: request.method,
              path: request.url,
              statusCode: response.statusCode,
              durationMs: Date.now() - now,
            }),
          );
        },
        error: (error: unknown) => {
          this.logger.error(
            JSON.stringify({
              message: 'http.request.failed',
              correlationId: this.correlationIdService.getCorrelationId(),
              method: request.method,
              path: request.url,
              statusCode: response.statusCode,
              durationMs: Date.now() - now,
              error:
                error instanceof Error ? error.message : 'Unknown error type',
            }),
          );
        },
      }),
    );
  }
}
