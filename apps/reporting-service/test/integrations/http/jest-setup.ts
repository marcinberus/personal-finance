import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Set default environment variables for HTTP tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-key-super-secret';

// Optionally load .env.test if it exists
const envTestPath = path.join(__dirname, '../../.env.test');
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
}
