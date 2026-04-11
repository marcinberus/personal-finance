module.exports = async function globalTeardown() {
  console.log('\n[Integration] Stopping PostgreSQL test container...');

  if (global.__PG_CONTAINER__) {
    await global.__PG_CONTAINER__.stop();
    console.log('[Integration] Container stopped.\n');
  }
};
