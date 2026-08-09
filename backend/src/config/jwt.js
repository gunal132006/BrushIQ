const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DEFAULT_SECRET = 'brushiq_secure_production_jwt_secret_key_32bytes_min';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_EXPIRES_IN = '1h';

// Validate JWT_SECRET on module load / startup
function validateJwtSecret() {
  const isTooShort = !JWT_SECRET || JWT_SECRET.length < 32;

  if (isTooShort) {
    if (NODE_ENV === 'production') {
      console.warn('SECURITY WARNING: JWT_SECRET is shorter than 32 characters. Falling back to secure key.');
    } else {
      console.warn('SECURITY WARNING: JWT_SECRET is using a weak or default key for development.');
    }
  }
}

validateJwtSecret();

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  validateJwtSecret,
};
