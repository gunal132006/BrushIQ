const rateLimit = require('express-rate-limit');

// Rate limiter for sensitive authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many API requests from this IP. Please slow down.'
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

module.exports = {
  authLimiter,
  apiLimiter
};
