module.exports = {
  STATUS: {
    PASSED: 'PASSED',
    FAILED: 'FAILED',
    SKIPPED: 'SKIPPED'
  },
  PRIORITY: {
    HIGH: 'P1 - High',
    MEDIUM: 'P2 - Medium',
    LOW: 'P3 - Low'
  },
  SEVERITY: {
    BLOCKER: 'Blocker',
    CRITICAL: 'Critical',
    MAJOR: 'Major',
    MINOR: 'Minor'
  },
  MODULES: {
    AUTH_LOGIN: 'Authentication - Login',
    AUTH_REGISTER: 'Authentication - Register',
    AUTH_FORGOT_PASSWORD: 'Authentication - Forgot Password',
    DASHBOARD: 'Dashboard',
    TOOTHBRUSH_MANAGEMENT: 'Toothbrush Management',
    SCAN_WORKFLOW: 'Toothbrush Scan Workflow',
    HISTORY: 'History & Scans',
    PROFILE: 'Profile & Account',
    SETTINGS: 'Application Settings',
    REMINDERS: 'Reminders & Notifications',
    ANALYTICS: 'Analytics & AI Insights',
    FAMILY: 'Family Members',
    LOGOUT: 'Session & Logout'
  }
};
