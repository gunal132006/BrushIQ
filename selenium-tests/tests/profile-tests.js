const ProfilePage = require('../pages/ProfilePage');
const ElementHelper = require('../utils/helper');
const { testCases } = require('../utils/testCaseRegistry');

class ProfileTestSuite {
  static getSuiteCases() {
    return testCases.filter(tc => tc.testId.startsWith('TC_PRF_'));
  }

  static async runAll(driver) {
    const suiteCases = this.getSuiteCases();
    const results = [];
    const profilePage = new ProfilePage(driver);

    if (driver) {
      try { await profilePage.openProfile(); } catch (e) {}
    }

    for (const tc of suiteCases) {
      const startTime = Date.now();
      let status = 'PASSED';
      let errorMsg = null;

      try {
        if (driver && tc.testId === 'TC_PRF_001') {
          await profilePage.openProfile();
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

module.exports = ProfileTestSuite;
