/**
 * Environment configuration for BrushIQ E2E Test Suite
 */
module.exports = {
  baseUrl: process.env.TEST_BASE_URL || 'https://brush-iq.vercel.app',
  apiBaseUrl: process.env.TEST_API_URL || 'https://brushiq-backend.onrender.com/api',
  timeout: 10000,
  pageLoadTimeout: 30000,
  implicitWait: 5000,
  testUsers: {
    validUser: {
      username: 'test.user@brushiq.com',
      password: 'Password123!',
      fullName: 'Test User'
    },
    adminUser: {
      username: 'admin@brushiq.com',
      password: 'AdminPassword123!',
      fullName: 'System Administrator'
    },
    invalidUser: {
      username: 'invalid.user@brushiq.com',
      password: 'WrongPassword999!'
    }
  }
};
