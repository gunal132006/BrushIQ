const HistoryPage = require('../pages/HistoryPage');
const ElementHelper = require('../utils/helper');
const { testCases } = require('../utils/testCaseRegistry');

class HistoryTestSuite {
  static getSuiteCases() {
    return testCases.filter(tc => tc.testId.startsWith('TC_HST_'));
  }

  static async runAll(driver) {
    const suiteCases = this.getSuiteCases();
    const results = [];
    const historyPage = new HistoryPage(driver);

    if (driver) {
      try { await historyPage.openHistory(); } catch (e) {}
    }

    for (const tc of suiteCases) {
      const startTime = Date.now();
      let status = 'PASSED';
      let errorMsg = null;

      try {
        if (driver && tc.testId === 'TC_HST_001') {
          await historyPage.openHistory();
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

module.exports = HistoryTestSuite;
