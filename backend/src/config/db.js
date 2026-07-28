const { Pool } = require('pg');
const path = require('path');
const dns = require('dns');

// Force IPv4 resolution preference in Node.js to avoid Render's lack of IPv6 egress support
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

const dbConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgrespassword',
      database: process.env.DB_DATABASE || 'brushiq',
      ssl: (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1')
        ? { rejectUnauthorized: false }
        : false
    };

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: {
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect(),
    on: (event, handler) => pool.on(event, handler)
  },
  getDbMode: () => 'postgresql',
  setDbMode: () => {}
};
