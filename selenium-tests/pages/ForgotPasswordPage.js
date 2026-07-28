const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class ForgotPasswordPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.usernameInput = By.id('username');
    this.submitBtn = By.css('button[type="submit"]');
    this.backToLoginLink = By.xpath("//a[contains(text(),'Back to Sign In')]");
    this.successMsg = By.xpath("//h3[contains(text(),'Request Dispatched!')]");
  }

  async openForgotPassword() {
    await this.open('/forgot-password');
  }

  async requestReset(username) {
    if (username !== undefined) {
      await ElementHelper.type(this.driver, this.usernameInput, username);
    }
    await ElementHelper.click(this.driver, this.submitBtn);
  }

  async isSuccessDisplayed() {
    return await ElementHelper.isDisplayed(this.driver, this.successMsg);
  }

  async clickBackToLogin() {
    await ElementHelper.click(this.driver, this.backToLoginLink);
  }
}

module.exports = ForgotPasswordPage;
