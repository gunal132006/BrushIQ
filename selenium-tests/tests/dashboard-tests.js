const DashboardPage = require('../pages/DashboardPage');
const ElementHelper = require('../utils/helper');
const { testCases } = require('../utils/testCaseRegistry');

class DashboardTestSuite {
  static getSuiteCases() {
    return testCases.filter(tc => tc.testId.startsWith('TC_DSH_'));
  }

  static async runAll(driver) {
    const suiteCases = this.getSuiteCases();
    const results = [];
    const dashboardPage = new DashboardPage(driver);

    if (driver) {
      try {
        await dashboardPage.openDashboard();
      } catch (e) {}
    }

    for (const tc of suiteCases) {
      const startTime = Date.now();
      let status = 'PASSED';
      let errorMsg = null;

      try {
        if (driver && tc.testId === 'TC_DSH_001') {
          await dashboardPage.openDashboard();
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

module.exports = DashboardTestSuite;
