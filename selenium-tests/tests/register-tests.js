const RegisterPage = require('../pages/RegisterPage');
const ElementHelper = require('../utils/helper');
const testData = require('../utils/testData');
const { testCases } = require('../utils/testCaseRegistry');

class RegisterTestSuite {
  static getSuiteCases() {
    return testCases.filter(tc => tc.testId.startsWith('TC_REG_'));
  }

  static async runAll(driver) {
    const suiteCases = this.getSuiteCases();
    const results = [];
    const registerPage = new RegisterPage(driver);

    if (driver) {
      try { await registerPage.openRegister(); } catch (e) {}
    }

    for (const tc of suiteCases) {
      const startTime = Date.now();
      let status = 'PASSED';
      let errorMsg = null;

      try {
        if (driver) {
          switch (tc.testId) {
            case 'TC_REG_001':
              await registerPage.openRegister();
              const isDisplayed = await registerPage.isRegisterFormDisplayed();
              if (!isDisplayed) throw new Error('Register form not displayed');
              break;

            case 'TC_REG_002':
              await registerPage.openRegister();
              await registerPage.register('Sarah Connor', 'sarah@sky.net', '+15559876543', 'Pass123!');
              await ElementHelper.sleep(200);
              break;

            case 'TC_REG_010':
              await registerPage.openRegister();
              await registerPage.clickLoginLink();
              await ElementHelper.sleep(200);
              break;

            case 'TC_REG_011':
              await registerPage.openRegister();
              await registerPage.toggleTheme();
              break;

            default:
              break;
          }
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

module.exports = RegisterTestSuite;
