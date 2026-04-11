const { unlinkSync } = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '.test-db-config.json');

module.exports = async function globalTeardown() {
  const container = global.__PG_CONTAINER__;

  if (container) {
    console.log('\n[Integration] Stopping PostgreSQL test container...');
    await container.stop();
    console.log('[Integration] Container stopped.\n');
  }

  try {
    unlinkSync(CONFIG_FILE);
  } catch {
    // File may not exist if setup failed — that's fine
  }
};
