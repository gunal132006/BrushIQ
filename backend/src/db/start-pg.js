const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');

async function main() {
  const pg = new EmbeddedPostgres({
    port: 5432,
    user: 'postgres',
    password: 'postgrespassword',
    database: 'brushiq',
    persistent: true,
    dataDir: path.join(__dirname, '../../pgdata_local')
  });

  try {
    console.log('[PG SERVER] Initialising binaries...');
    await pg.initialise();
  } catch (e) {
    console.log('[PG SERVER] Binaries already initialized.');
  }

  console.log('[PG SERVER] Starting PostgreSQL daemon on port 5432...');
  await pg.start();
  console.log('[PG SERVER] PostgreSQL database READY and ACCEPTING CONNECTIONS on port 5432.');
}

main().catch(err => {
  console.error('[PG SERVER ERROR]', err);
});
