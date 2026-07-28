const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.welcomeBanner = By.xpath("//h2[contains(text(),'Good')] | //h1[contains(text(),'Dashboard')] | //div[contains(text(),'Welcome')]");
    this.startScanBtn = By.xpath("//button[contains(text(),'Start Scan')] | //a[@href='/scan']");
    this.addBrushBtn = By.xpath("//button[contains(text(),'Add Toothbrush')] | //a[@href='/toothbrushes']");
    this.statsCards = By.css('.grid, .rounded-2xl, .bg-white');
    this.activeBrushCard = By.xpath("//h3[contains(text(),'Active Toothbrush')] | //div[contains(text(),'Toothbrush')]");
    this.recentScansWidget = By.xpath("//h3[contains(text(),'Recent Scans')] | //div[contains(text(),'History')]");
  }

  async openDashboard() {
    await this.open('/');
  }

  async clickStartScan() {
    await ElementHelper.click(this.driver, this.startScanBtn);
  }

  async clickAddBrush() {
    await ElementHelper.click(this.driver, this.addBrushBtn);
  }

  async isDashboardLoaded() {
    return await ElementHelper.isDisplayed(this.driver, this.startScanBtn, 5000);
  }
}

module.exports = DashboardPage;
