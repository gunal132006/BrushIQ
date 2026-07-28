const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class AnalyticsPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.chartCanvas = By.css('canvas, .chart-container, svg');
    this.timeframeSelect = By.css('select, button[aria-label="Timeframe"]');
    this.insightsWidget = By.xpath("//h3[contains(text(),'AI Insights')] | //div[contains(text(),'Insights')]");
  }

  async openAnalytics() {
    await this.open('/tips');
  }

  async isAnalyticsLoaded() {
    return (await ElementHelper.getCurrentUrl(this.driver)).includes('/tips') || (await ElementHelper.getCurrentUrl(this.driver)).includes('/analytics');
  }
}

module.exports = AnalyticsPage;
