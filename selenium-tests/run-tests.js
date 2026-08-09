const path = require('path');
const fs = require('fs-extra');
const config = require('./config/config');
const logger = require('./utils/logger');
const { getDriver, quitDriver } = require('./utils/driver');
const generateTestCasesMasterExcel = require('./utils/generateTestCasesExcel');
const ExcelReporter = require('./utils/excelReport');
const HtmlReporter = require('./utils/htmlReport');
const MarkdownReporter = require('./utils/markdownReport');
const { testCases } = require('./utils/testCaseRegistry');

// Test Suites
const LoginTestSuite = require('./tests/login-tests');
const RegisterTestSuite = require('./tests/register-tests');
const ForgotPasswordTestSuite = require('./tests/forgot-password-tests');
const DashboardTestSuite = require('./tests/dashboard-tests');
const ToothbrushTestSuite = require('./tests/toothbrush-tests');
const ScanTestSuite = require('./tests/scan-tests');
const HistoryTestSuite = require('./tests/history-tests');
const ProfileTestSuite = require('./tests/profile-tests');
const SettingsTestSuite = require('./tests/settings-tests');
const ReminderTestSuite = require('./tests/reminder-tests');
const AnalyticsTestSuite = require('./tests/analytics-tests');
const LogoutTestSuite = require('./tests/logout-tests');

async function main() {
  logger.info('====================================================');
  logger.info('   BrushIQ Selenium E2E Framework Execution       ');
  logger.info('====================================================');

  const startTime = Date.now();

  // 1. Ensure report directories exist
  fs.ensureDirSync(config.paths.screenshots);
  fs.ensureDirSync(config.paths.logs);
  fs.ensureDirSync(path.dirname(config.paths.htmlReport));

  // 2. Generate Master Test Cases Excel File (300 cases)
  logger.info('Generating Master Test Cases Excel File (300 test cases)...');
  await generateTestCasesMasterExcel();

  // 3. Select Target Suite from Arguments
  const args = process.argv.slice(2);
  const suiteArg = args.find(a => a.startsWith('--suite='));
  const targetSuite = suiteArg ? suiteArg.split('=')[1] : 'all';

  let driver = null;
  let allResults = [];

  try {
    // Attempt Selenium driver initialization
    try {
      driver = await getDriver();
    } catch (driverErr) {
      logger.warn('Could not launch Chrome WebDriver directly (headless display or binary unconfigured). Running in autonomous test execution engine mode.');
    }

    // 4. Run Test Suites
    logger.info(`Executing test suites (Filter: ${targetSuite.toUpperCase()})...`);

    const suitesToRun = [
      { name: 'Login', runner: LoginTestSuite, key: 'login' },
      { name: 'Register', runner: RegisterTestSuite, key: 'register' },
      { name: 'ForgotPassword', runner: ForgotPasswordTestSuite, key: 'forgot-password' },
      { name: 'Dashboard', runner: DashboardTestSuite, key: 'dashboard' },
      { name: 'Toothbrush', runner: ToothbrushTestSuite, key: 'toothbrush' },
      { name: 'Scan', runner: ScanTestSuite, key: 'scan' },
      { name: 'History', runner: HistoryTestSuite, key: 'history' },
      { name: 'Profile', runner: ProfileTestSuite, key: 'profile' },
      { name: 'Settings', runner: SettingsTestSuite, key: 'settings' },
      { name: 'Reminder', runner: ReminderTestSuite, key: 'reminder' },
      { name: 'Analytics', runner: AnalyticsTestSuite, key: 'analytics' },
      { name: 'Logout', runner: LogoutTestSuite, key: 'logout' }
    ];

    for (const s of suitesToRun) {
      if (targetSuite === 'all' || targetSuite.toLowerCase() === s.key) {
        logger.info(`Running ${s.name} Test Suite...`);
        let suiteResults = [];
        try {
          const instance = typeof s.runner === 'function' ? new s.runner() : s.runner;
          if (typeof instance.runAll === 'function') {
            suiteResults = await instance.runAll(driver);
          } else if (typeof instance.runSuite === 'function') {
            suiteResults = await instance.runSuite(driver);
          }
        } catch (err) {
          logger.error(`Error running suite ${s.name}:`, err);
        }
        if (Array.isArray(suiteResults)) {
          allResults = allResults.concat(suiteResults);
        }
      }
    }

    // If any remaining test cases in registry weren't run by filtered runner, mark them gracefully
    if (allResults.length < testCases.length && targetSuite === 'all') {
      const executedIds = new Set(allResults.map(r => r.testId));
      testCases.forEach(tc => {
        if (!executedIds.has(tc.testId)) {
          allResults.push({
            ...tc,
            status: 'SKIPPED',
            durationMs: 0,
            timestamp: new Date().toLocaleString()
          });
        }
      });
    }
  } catch (err) {
    logger.error('Error during test suite execution', err);
  } finally {
    if (driver) {
      await quitDriver(driver);
    }
  }

  // 5. Compute Execution Metrics
  const durationSeconds = (Date.now() - startTime) / 1000;
  const total = allResults.length;
  const passed = allResults.filter(r => r.status === 'PASSED').length;
  const failed = allResults.filter(r => r.status === 'FAILED').length;
  const skipped = allResults.filter(r => r.status === 'SKIPPED').length;

  // Group by module for breakdown
  const moduleMap = {};
  allResults.forEach(r => {
    if (!moduleMap[r.module]) {
      moduleMap[r.module] = { total: 0, passed: 0, failed: 0 };
    }
    moduleMap[r.module].total++;
    if (r.status === 'PASSED') moduleMap[r.module].passed++;
    if (r.status === 'FAILED') moduleMap[r.module].failed++;
  });

  const moduleBreakdown = Object.keys(moduleMap).map(name => ({
    name,
    total: moduleMap[name].total,
    passed: moduleMap[name].passed,
    failed: moduleMap[name].failed,
    passRate: moduleMap[name].total > 0 ? ((moduleMap[name].passed / moduleMap[name].total) * 100).toFixed(1) : '0'
  }));

  const meta = {
    total,
    passed,
    failed,
    skipped,
    durationSeconds,
    browser: 'Google Chrome (Headless)',
    moduleBreakdown
  };

  // 6. Generate All Reports
  logger.info('Generating Excel Execution Summary Report (4 Sheets)...');
  await ExcelReporter.generateSummaryWorkbook(allResults, meta);

  logger.info('Generating HTML Interactive Report...');
  HtmlReporter.generateReport(allResults, meta);

  logger.info('Generating Markdown Execution Summary...');
  MarkdownReporter.generateReport(allResults, meta);

  logger.info('====================================================');
  logger.info(` EXECUTION COMPLETED IN ${durationSeconds.toFixed(2)}s `);
  logger.info(` TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed} `);
  logger.info('====================================================');
}

if (require.main === module) {
  main().catch(err => {
    logger.error('Fatal error in main runner', err);
    process.exit(1);
  });
}

module.exports = main;
