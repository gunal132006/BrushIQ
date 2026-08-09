const rateLimit = require('express-rate-limit');

const isDevelopment = process.env.NODE_ENV !== 'production';

// Development: 100 failed attempts per 15 mins; Production: 15 failed attempts per 15 mins
const authMaxAttempts = isDevelopment ? 100 : 15;
const apiMaxRequests = isDevelopment ? 1000 : 200;

/**
 * Custom 429 Handler returning standardized JSON payload and Retry-After header.
 */
const handleRateLimitExceeded = (customMessage) => (req, res, next, options) => {
  const resetTime = req.rateLimit && req.rateLimit.resetTime 
    ? req.rateLimit.resetTime 
    : new Date(Date.now() + 15 * 60 * 1000);
  
  const retryAfterSeconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));

  res.setHeader('Retry-After', retryAfterSeconds);
  return res.status(429).json({
    message: customMessage || 'Too many authentication attempts. Please try again later.',
    retryAfterSeconds
  });
};

// Sensitive authentication endpoints rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: authMaxAttempts,
  skipSuccessfulRequests: true, // Successful logins/signups DO NOT consume failed attempt quota
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded('Too many authentication attempts. Please try again later.')
});

// General API rate limiter for non-auth endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: apiMaxRequests,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handleRateLimitExceeded('Too many API requests from this IP. Please slow down.')
});

/**
 * Resets the in-memory rate limiter store for development environment.
 */
const resetAuthLimiter = (req, res) => {
  if (!isDevelopment) {
    return res.status(403).json({ message: 'Resetting rate limiters is restricted to development environment.' });
  }
  const clientIp = req.ip || '127.0.0.1';
  if (authLimiter.resetKey) {
    authLimiter.resetKey(clientIp);
    if (clientIp.includes('::ffff:')) {
      authLimiter.resetKey(clientIp.replace('::ffff:', ''));
    }
  }
  return res.json({ message: 'Authentication rate limiter successfully reset for your IP.', ip: clientIp });
};

module.exports = {
  authLimiter,
  apiLimiter,
  resetAuthLimiter
};
