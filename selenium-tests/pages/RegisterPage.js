const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class RegisterPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.fullNameInput = By.id('fullName');
    this.emailInput = By.id('email');
    this.phoneInput = By.id('phone');
    this.passwordInput = By.id('password');
    this.submitBtn = By.css('button[type="submit"]');
    this.loginLink = By.css('a[href="/login"]');
    this.heading = By.xpath("//h2[contains(text(),'Create Account')]");
  }

  async openRegister() {
    await this.open('/register');
  }

  async register(fullName, email, phone, password) {
    if (fullName) await ElementHelper.type(this.driver, this.fullNameInput, fullName);
    if (email) await ElementHelper.type(this.driver, this.emailInput, email);
    if (phone) await ElementHelper.type(this.driver, this.phoneInput, phone);
    if (password) await ElementHelper.type(this.driver, this.passwordInput, password);
    await ElementHelper.click(this.driver, this.submitBtn);
  }

  async clickLoginLink() {
    await ElementHelper.click(this.driver, this.loginLink);
  }

  async isRegisterFormDisplayed() {
    return await ElementHelper.isDisplayed(this.driver, this.fullNameInput);
  }
}

module.exports = RegisterPage;
