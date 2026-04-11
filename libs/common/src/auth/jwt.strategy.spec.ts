import type { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy (common)', () => {
  it('maps JWT payload to authenticated user shape', () => {
    const configService = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as ConfigService;

    const strategy = new JwtStrategy(configService);
    const result = strategy.validate({
      sub: 'user-id-1',
      email: 'user@example.com',
    });

    expect(result).toEqual({ id: 'user-id-1', email: 'user@example.com' });
  });

  it('throws when JWT_SECRET is not configured', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(() => new JwtStrategy(configService)).toThrow(
      'JWT_SECRET is not configured',
    );
  });
});
