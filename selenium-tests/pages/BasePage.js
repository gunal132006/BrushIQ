const { By } = require('selenium-webdriver');
const ElementHelper = require('../utils/helper');
const config = require('../config/config');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    // Common elements
    this.themeToggleBtn = By.css('button[aria-label="Toggle dark mode"]');
    this.logoBrand = By.xpath("//h2[contains(text(),'BrushIQ')]");
    this.alertMessage = By.css('.bg-rose-50, .bg-rose-955, .text-rose-500');
    // Navigation items in sidebar/layout
    this.navDashboard = By.xpath("//span[contains(text(),'Dashboard')] | //a[@href='/']");
    this.navToothbrushes = By.xpath("//span[contains(text(),'Toothbrushes')] | //a[@href='/toothbrushes']");
    this.navScan = By.xpath("//span[contains(text(),'Scan')] | //a[@href='/scan']");
    this.navHistory = By.xpath("//span[contains(text(),'History')] | //a[@href='/history']");
    this.navReminders = By.xpath("//span[contains(text(),'Reminders')] | //a[@href='/reminders']");
    this.navTips = By.xpath("//span[contains(text(),'Tips')] | //a[@href='/tips']");
    this.navFamily = By.xpath("//span[contains(text(),'Family')] | //a[@href='/family']");
    this.navSettings = By.xpath("//span[contains(text(),'Settings')] | //a[@href='/settings']");
    this.logoutBtn = By.xpath("//button[contains(text(),'Logout')] | //button[contains(@aria-label,'Logout')]");
  }

  async open(path = '/') {
    await ElementHelper.navigateTo(this.driver, path);
  }

  async toggleTheme() {
    if (await ElementHelper.isDisplayed(this.driver, this.themeToggleBtn, 2000)) {
      await ElementHelper.click(this.driver, this.themeToggleBtn);
    }
  }

  async getAlertText() {
    return await ElementHelper.getText(this.driver, this.alertMessage);
  }

  async isAlertVisible() {
    return await ElementHelper.isDisplayed(this.driver, this.alertMessage, 3000);
  }

  async getCurrentPageUrl() {
    return await ElementHelper.getCurrentUrl(this.driver);
  }

  async navigateToModule(moduleName) {
    switch (moduleName.toLowerCase()) {
      case 'dashboard':
        await ElementHelper.click(this.driver, this.navDashboard);
        break;
      case 'toothbrushes':
        await ElementHelper.click(this.driver, this.navToothbrushes);
        break;
      case 'scan':
        await ElementHelper.click(this.driver, this.navScan);
        break;
      case 'history':
        await ElementHelper.click(this.driver, this.navHistory);
        break;
      case 'reminders':
        await ElementHelper.click(this.driver, this.navReminders);
        break;
      case 'tips':
        await ElementHelper.click(this.driver, this.navTips);
        break;
      case 'family':
        await ElementHelper.click(this.driver, this.navFamily);
        break;
      case 'settings':
        await ElementHelper.click(this.driver, this.navSettings);
        break;
      default:
        await this.open('/');
    }
  }
}

module.exports = BasePage;
