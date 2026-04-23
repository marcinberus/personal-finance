// Sets required env vars before the NestJS app boots in HTTP integration tests.
process.env.JWT_SECRET = 'test-http-secret';
process.env.JWT_EXPIRES_IN = '1d';
process.env.AUTH_REFRESH_SECRET = 'test-http-refresh-secret';
process.env.INTERNAL_SECRET = 'test-internal-secret';
