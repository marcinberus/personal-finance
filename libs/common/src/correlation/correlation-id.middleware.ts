import type { Request, Response, NextFunction } from 'express';
import { CorrelationIdService } from './correlation-id.service';
import { CORRELATION_ID_HEADER } from './correlation-id.constants';

export function createCorrelationIdMiddleware(
  correlationIdService: CorrelationIdService,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestHeader = req.header(CORRELATION_ID_HEADER);

    correlationIdService.runWithCorrelationId(requestHeader, () => {
      const correlationId = correlationIdService.getCorrelationId();

      if (correlationId) {
        req.headers[CORRELATION_ID_HEADER] = correlationId;
        res.setHeader(CORRELATION_ID_HEADER, correlationId);
      }

      next();
    });
  };
}
