const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.usernameInput = By.id('username');
    this.passwordInput = By.id('password');
    this.submitBtn = By.css('button[type="submit"]');
    this.googleSignInBtn = By.xpath("//button[contains(text(),'Google Sign In')]");
    this.registerLink = By.css('a[href="/register"]');
    this.forgotPasswordLink = By.css('a[href="/forgot-password"]');
    this.formHeading = By.xpath("//h2[contains(text(),'BrushIQ')]");
  }

  async openLogin() {
    await this.open('/login');
  }

  async enterUsername(username) {
    await ElementHelper.type(this.driver, this.usernameInput, username);
  }

  async enterPassword(password) {
    await ElementHelper.type(this.driver, this.passwordInput, password);
  }

  async clickSubmit() {
    await ElementHelper.click(this.driver, this.submitBtn);
  }

  async login(username, password) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickSubmit();
  }

  async clickGoogleSignIn() {
    await ElementHelper.click(this.driver, this.googleSignInBtn);
  }

  async clickRegisterLink() {
    await ElementHelper.click(this.driver, this.registerLink);
  }

  async clickForgotPasswordLink() {
    await ElementHelper.click(this.driver, this.forgotPasswordLink);
  }

  async isFormDisplayed() {
    return await ElementHelper.isDisplayed(this.driver, this.usernameInput);
  }
}

module.exports = LoginPage;
