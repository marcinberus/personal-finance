import {
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdentityClientService } from './identity-client.service';

const buildConfigService = (
  overrides: Record<string, string> = {},
): ConfigService => {
  const values: Record<string, string> = {
    IDENTITY_SERVICE_URL: 'http://identity-service:3000',
    INTERNAL_SECRET: 'internal-secret',
    IDENTITY_HTTP_TIMEOUT_MS: '100',
    IDENTITY_HTTP_RETRIES: '1',
    ...overrides,
  };

  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
};

const makeResponse = (status: number, body: unknown = {}): Response => {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
};

describe('IdentityClientService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return user info when identity responds successfully', async () => {
    const service = new IdentityClientService(buildConfigService());
    const fetchMock = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { id: 'u-1', email: 'u@x.com' }));
    global.fetch = fetchMock as typeof fetch;

    const result = await service.getUserById('u-1');

    expect(result).toEqual({ id: 'u-1', email: 'u@x.com' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should retry on 5xx and then succeed', async () => {
    const service = new IdentityClientService(buildConfigService());
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(makeResponse(503))
      .mockResolvedValueOnce(
        makeResponse(200, { id: 'u-1', email: 'u@x.com' }),
      );
    global.fetch = fetchMock as typeof fetch;

    const result = await service.getUserById('u-1');

    expect(result).toEqual({ id: 'u-1', email: 'u@x.com' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should throw ServiceUnavailableException after retryable errors', async () => {
    const service = new IdentityClientService(buildConfigService());
    const fetchMock = jest
      .fn()
      .mockRejectedValue(new TypeError('fetch failed')); // network failure
    global.fetch = fetchMock as typeof fetch;

    await expect(service.getUserById('u-1')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should throw NotFoundException for missing users without retry', async () => {
    const service = new IdentityClientService(buildConfigService());
    const fetchMock = jest.fn().mockResolvedValue(makeResponse(404));
    global.fetch = fetchMock as typeof fetch;

    await expect(service.getUserById('missing-user')).rejects.toThrow(
      NotFoundException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should throw InternalServerErrorException on non-retryable 4xx', async () => {
    const service = new IdentityClientService(buildConfigService());
    const fetchMock = jest.fn().mockResolvedValue(makeResponse(401));
    global.fetch = fetchMock as typeof fetch;

    await expect(service.getUserById('u-1')).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
