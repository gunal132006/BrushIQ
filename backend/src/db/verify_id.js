const db = require('../config/db');

async function run() {
  try {
    const dbName = await db.query('SELECT current_database()');
    const dbUser = await db.query('SELECT current_user');
    const dbAddr = await db.query('SELECT inet_server_addr()');
    const dbVer = await db.query('SELECT version()');
    const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");

    console.log('CURRENT DATABASE:', dbName.rows[0].current_database);
    console.log('CURRENT USER:', dbUser.rows[0].current_user);
    console.log('INET SERVER ADDR:', dbAddr.rows[0].inet_server_addr || '127.0.0.1/socket');
    console.log('VERSION:', dbVer.rows[0].version);
    console.log('EXISTING TABLES:', tables.rows.map(r => r.table_name));
    process.exit(0);
  } catch (err) {
    console.error('VERIFY ERROR:', err);
    process.exit(1);
  }
}

run();
