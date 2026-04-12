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

  global.__PG_CONTAINER__ = container;

  const connectionUrl = new URL(container.getConnectionUri());
  connectionUrl.searchParams.set('schema', 'ledger');
  connectionUrl.searchParams.set('options', '-c search_path=ledger');
  const connectionString = connectionUrl.toString();
  console.log(`[Integration] Container started at: ${connectionString}`);

  writeFileSync(CONFIG_FILE, JSON.stringify({ connectionString }));

  console.log('[Integration] Running Prisma migrations...');
  execSync('npx prisma migrate deploy --config apps/ledger-service/prisma.config.ts', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', '..', '..', '..', '..'),
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
      LEDGER_DATABASE_URL: connectionString,
    },
  });

  console.log('[Integration] Setup complete.\n');
};
