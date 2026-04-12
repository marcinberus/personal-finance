import type { NextFunction, Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from './correlation-id.constants';
import { createCorrelationIdMiddleware } from './correlation-id.middleware';
import { CorrelationIdService } from './correlation-id.service';

describe('createCorrelationIdMiddleware', () => {
  let correlationIdService: CorrelationIdService;

  type RequestLike = {
    header: (name: string) => string | undefined;
    headers: Request['headers'];
  };

  beforeEach(() => {
    correlationIdService = new CorrelationIdService();
  });

  function createRequest(headerValue?: string): RequestLike {
    return {
      header: (name: string) => {
        if (name === CORRELATION_ID_HEADER) {
          return headerValue;
        }

        return undefined;
      },
      headers: {},
    };
  }

  function createResponse(): Pick<Response, 'setHeader'> {
    return {
      setHeader: jest.fn(),
    };
  }

  it('should reuse incoming correlation ID and expose it to response headers', () => {
    const middleware = createCorrelationIdMiddleware(correlationIdService);
    const req = createRequest('incoming-corr-1');
    const res = createResponse();
    const next: NextFunction = jest.fn();

    middleware(req as Request, res as Response, next);

    expect(req.headers[CORRELATION_ID_HEADER]).toBe('incoming-corr-1');
    expect(res.setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      'incoming-corr-1',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should generate correlation ID when request header is absent', () => {
    const middleware = createCorrelationIdMiddleware(correlationIdService);
    const req = createRequest(undefined);
    const res = createResponse();
    const next: NextFunction = jest.fn();

    middleware(req as Request, res as Response, next);

    const generated = req.headers[CORRELATION_ID_HEADER];
    expect(typeof generated).toBe('string');
    expect(generated).toHaveLength(36);
    expect(res.setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      generated,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
