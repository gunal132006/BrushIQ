const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class ProfilePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.nameInput = By.css('input[name="name"], #fullName, input[value]');
    this.emailInput = By.css('input[name="email"], #email');
    this.saveProfileBtn = By.xpath("//button[contains(text(),'Save Profile')] | //button[contains(text(),'Update')] | //button[contains(text(),'Save')]");
    this.changePasswordBtn = By.xpath("//button[contains(text(),'Change Password')]");
  }

  async openProfile() {
    await this.open('/settings');
  }

  async updateProfileName(newName) {
    if (await ElementHelper.isDisplayed(this.driver, this.nameInput, 2000)) {
      await ElementHelper.type(this.driver, this.nameInput, newName);
      await ElementHelper.click(this.driver, this.saveProfileBtn);
    }
  }

  async isProfileLoaded() {
    return (await ElementHelper.getCurrentUrl(this.driver)).includes('/settings');
  }
}

module.exports = ProfilePage;
