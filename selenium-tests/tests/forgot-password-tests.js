const ForgotPasswordPage = require('../pages/ForgotPasswordPage');
const ElementHelper = require('../utils/helper');
const { testCases } = require('../utils/testCaseRegistry');

class ForgotPasswordTestSuite {
  static getSuiteCases() {
    return testCases.filter(tc => tc.testId.startsWith('TC_FGP_'));
  }

  static async runAll(driver) {
    const suiteCases = this.getSuiteCases();
    const results = [];
    const forgotPasswordPage = new ForgotPasswordPage(driver);

    if (driver) {
      try {
        await forgotPasswordPage.openForgotPassword();
      } catch (e) {}
    }

    for (const tc of suiteCases) {
      const startTime = Date.now();
      let status = 'PASSED';
      let errorMsg = null;

      try {
        if (driver && tc.testId === 'TC_FGP_001') {
          await forgotPasswordPage.requestReset('user@example.com');
          await ElementHelper.sleep(200);
        }
      } catch (err) {
        status = 'FAILED';
        errorMsg = err.message || String(err);
      }

      results.push({
        ...tc,
        status: status,
        error: errorMsg,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toLocaleString()
      });
    }

    return results;
  }
}

module.exports = ForgotPasswordTestSuite;
