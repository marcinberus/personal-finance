// Sets required env vars before the NestJS app boots in HTTP integration tests.
process.env.JWT_SECRET = 'test-http-secret';
process.env.JWT_EXPIRES_IN = '1d';
process.env.OUTBOX_PUBLISHER_ENABLED = 'false';
process.env.IDENTITY_SERVICE_URL = 'http://localhost:3000';
process.env.INTERNAL_SECRET = 'test-internal-secret';
