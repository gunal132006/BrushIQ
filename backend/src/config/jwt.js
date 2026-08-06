const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_EXPIRES_IN = '1h';

// Validate JWT_SECRET on module load / startup
function validateJwtSecret() {
  const isDefaultSecret = !JWT_SECRET || JWT_SECRET === 'supersecretbrushiqjwttoken' || JWT_SECRET.includes('yoursupersecurejwtsecretkey');
  const isTooShort = JWT_SECRET && JWT_SECRET.length < 32;

  if (isDefaultSecret || isTooShort) {
    if (NODE_ENV === 'production') {
      console.error('\x1b[31m%s\x1b[0m', '================================================================');
      console.error('\x1b[31m%s\x1b[0m', 'FATAL SECURITY ERROR: JWT_SECRET is invalid or insecure!');
      console.error('\x1b[31m%s\x1b[0m', 'JWT_SECRET must be set in environment variables and be >= 32 chars.');
      console.error('\x1b[31m%s\x1b[0m', '================================================================');
      process.exit(1);
    } else {
      console.warn('\x1b[33m%s\x1b[0m', 'SECURITY WARNING: JWT_SECRET is using a weak or default key for development.');
    }
  }
}

validateJwtSecret();

module.exports = {
  JWT_SECRET: JWT_SECRET || 'dev_secret_brushiq_only_for_local_testing_key_32bytes',
  JWT_EXPIRES_IN,
  validateJwtSecret,
};
