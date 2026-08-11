const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

console.log('=== DATABASE CONNECTION DIAGNOSTICS ===');
console.log('DB_HOST:', process.env.DB_HOST || '(not set)');
console.log('DB_PORT:', process.env.DB_PORT || '(not set)');
console.log('DB_USER:', process.env.DB_USER || '(not set)');
console.log('DB_DATABASE:', process.env.DB_DATABASE || '(not set)');
console.log('DB_SSL:', process.env.DB_SSL || '(not set)');
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

const dbHost = process.env.DB_HOST || 'localhost';
const pool = new Pool({
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  database: process.env.DB_DATABASE || 'brushiq',
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000
});

async function run() {
  try {
    const client = await pool.connect();
    console.log('[TEST] pool.connect() succeeded!');
    const res1 = await client.query('SELECT 1 as num');
    console.log('[TEST] SELECT 1:', res1.rows);
    const res2 = await client.query('SELECT current_database()');
    console.log('[TEST] current_database:', res2.rows[0].current_database);
    const res3 = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('[TEST] Public tables:', res3.rows.map(r => r.table_name));
    client.release();
  } catch (err) {
    console.error('[TEST ERROR]', err.message);
  } finally {
    await pool.end();
  }
}

run();
