const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class SettingsPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.notificationsToggle = By.css('input[type="checkbox"], button[role="switch"]');
    this.themeSelect = By.css('select[name="theme"], button[aria-label="Toggle dark mode"]');
    this.saveSettingsBtn = By.xpath("//button[contains(text(),'Save')]");
  }

  async openSettings() {
    await this.open('/settings');
  }

  async isSettingsLoaded() {
    return (await ElementHelper.getCurrentUrl(this.driver)).includes('/settings');
  }
}

module.exports = SettingsPage;
