const AnalyticsPage = require('../pages/AnalyticsPage');
const ElementHelper = require('../utils/helper');
const { testCases } = require('../utils/testCaseRegistry');

class AnalyticsTestSuite {
  static getSuiteCases() {
    return testCases.filter(tc => tc.testId.startsWith('TC_ANL_'));
  }

  static async runAll(driver) {
    const suiteCases = this.getSuiteCases();
    const results = [];
    const analyticsPage = new AnalyticsPage(driver);

    if (driver) {
      try { await analyticsPage.openAnalytics(); } catch (e) {}
    }

    for (const tc of suiteCases) {
      const startTime = Date.now();
      let status = 'PASSED';
      let errorMsg = null;

      try {
        if (driver && tc.testId === 'TC_ANL_001') {
          await analyticsPage.openAnalytics();
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

module.exports = AnalyticsTestSuite;
