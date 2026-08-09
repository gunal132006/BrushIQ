const { Pool } = require('pg');
const path = require('path');
const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function sanitizeDbHost(rawHost) {
  if (!rawHost) return 'localhost';
  let host = rawHost.trim();
  if (host.startsWith('postgres.') && !host.includes('.supabase.')) {
    const ref = host.replace('postgres.', '');
    host = `db.${ref}.supabase.co`;
  } else if (!host.includes('.') && host !== 'localhost') {
    host = `db.${host}.supabase.co`;
  }
  return host;
}

function sanitizeConnectionString(url) {
  if (!url) return null;
  let s = url.trim();
  s = s.replace(/@postgres\.([a-z0-9]+)(:\d+)?\//i, '@db.$1.supabase.co$2/');
  return s;
}

const rawConnectionString = process.env.DATABASE_URL;
const connectionString = sanitizeConnectionString(rawConnectionString);
const dbHost = sanitizeDbHost(process.env.DB_HOST);

const dbConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    }
  : {
      host: dbHost,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgrespassword',
      database: process.env.DB_DATABASE || 'brushiq',
      ssl: (dbHost && dbHost !== 'localhost' && dbHost !== '127.0.0.1')
        ? { rejectUnauthorized: false }
        : false
    };

const pool = new Pool(dbConfig);
let pgConnected = false;

// Strict PostgreSQL connection test
async function checkDbConnection() {
  try {
    await pool.query('SELECT 1');
    pgConnected = true;
    console.log('[POSTGRESQL] Connection established successfully.');
    return true;
  } catch (err) {
    pgConnected = false;
    console.error('[FATAL DATABASE ERROR]');
    console.error('PostgreSQL connection unavailable:', err.message);
    console.error('Server startup aborted.');
    return false;
  }
}

// Initial connection test
checkDbConnection();

pool.on('error', (err) => {
  pgConnected = false;
  console.error('[POSTGRESQL ERROR] Client error:', err.message);
});

async function query(text, params) {
  try {
    const res = await pool.query(text, params);
    pgConnected = true;
    return res;
  } catch (err) {
    console.error('[POSTGRESQL QUERY ERROR]', err.message);
    pgConnected = false;
    throw err;
  }
}

async function queryPgOnly(text, params) {
  return query(text, params);
}

module.exports = {
  query,
  queryPgOnly,
  isPgConnected: () => pgConnected,
  setPgConnected: (val) => { pgConnected = val; },
  pool,
  checkDbConnection,
  getDbMode: () => 'postgresql'
};
