import { CorrelationIdService } from './correlation-id.service';

describe('CorrelationIdService', () => {
  let service: CorrelationIdService;

  beforeEach(() => {
    service = new CorrelationIdService();
  });

  it('should use provided correlation ID after trimming whitespace', () => {
    const result = service.runWithCorrelationId('  corr-123  ', () =>
      service.getCorrelationId(),
    );

    expect(result).toBe('corr-123');
  });

  it('should generate a correlation ID when not provided', () => {
    const result = service.runWithCorrelationId(undefined, () =>
      service.getCorrelationId(),
    );

    expect(result).toEqual(expect.any(String));
    expect(result).toHaveLength(36);
  });

  it('should truncate a correlation ID longer than 128 chars', () => {
    const longId = 'a'.repeat(150);

    const result = service.runWithCorrelationId(longId, () =>
      service.getCorrelationId(),
    );

    expect(result).toBe('a'.repeat(128));
  });

  it('should keep different values isolated across nested scopes', () => {
    service.runWithCorrelationId('outer-corr', () => {
      expect(service.getCorrelationId()).toBe('outer-corr');

      service.runWithCorrelationId('inner-corr', () => {
        expect(service.getCorrelationId()).toBe('inner-corr');
      });

      expect(service.getCorrelationId()).toBe('outer-corr');
    });
  });
});
