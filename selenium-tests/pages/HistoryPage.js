const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class HistoryPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.searchInput = By.css('input[placeholder*="Search"], input[type="search"]');
    this.filterDropdown = By.css('select, button[aria-label="Filter"]');
    this.historyItem = By.css('.history-card, .border, .rounded-2xl');
    this.clearHistoryBtn = By.xpath("//button[contains(text(),'Clear History')]");
  }

  async openHistory() {
    await this.open('/history');
  }

  async searchHistory(query) {
    if (await ElementHelper.isDisplayed(this.driver, this.searchInput, 2000)) {
      await ElementHelper.type(this.driver, this.searchInput, query);
    }
  }

  async isHistoryLoaded() {
    return (await ElementHelper.getCurrentUrl(this.driver)).includes('/history');
  }
}

module.exports = HistoryPage;
