const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '.test-db-config.json');

module.exports = async function globalSetup() {
  console.log('\n[Integration] Starting PostgreSQL test container...');

  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('integration_test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  // Store on global so globalTeardown (same process) can stop it
  global.__PG_CONTAINER__ = container;

  const connectionString = container.getConnectionUri();
  console.log(`[Integration] Container started at: ${connectionString}`);

  // Write connection string to a file so Jest worker processes can read it
  writeFileSync(CONFIG_FILE, JSON.stringify({ connectionString }));

  console.log('[Integration] Running Prisma migrations...');
  execSync('npx prisma migrate deploy --config apps/identity-service/prisma.config.ts', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', '..', '..', '..', '..'),
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
      IDENTITY_DATABASE_URL: connectionString,
    },
  });

  console.log('[Integration] Setup complete.\n');
};
