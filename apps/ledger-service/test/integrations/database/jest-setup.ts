import { readFileSync } from 'fs';
import { join } from 'path';

const configFile = join(__dirname, '.test-db-config.json');
const { connectionString } = JSON.parse(readFileSync(configFile, 'utf-8')) as {
  connectionString: string;
};

process.env.DATABASE_URL = connectionString;
process.env.LEDGER_DATABASE_URL = connectionString;
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_EXPIRES_IN = '1d';
