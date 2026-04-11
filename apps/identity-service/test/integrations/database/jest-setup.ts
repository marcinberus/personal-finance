import { readFileSync } from 'fs';
import { join } from 'path';

// This file runs in each Jest worker process (via setupFiles in jest-database.json).
// It reads the database URL written by globalSetup and injects it into process.env
// so that ConfigModule (and therefore PrismaService) connects to the test container.

const configFile = join(__dirname, '.test-db-config.json');
const { connectionString } = JSON.parse(readFileSync(configFile, 'utf-8')) as {
  connectionString: string;
};

process.env.DATABASE_URL = connectionString;
process.env.IDENTITY_DATABASE_URL = connectionString;
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_EXPIRES_IN = '1d';
