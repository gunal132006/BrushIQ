const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class FamilyPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.addMemberBtn = By.xpath("//button[contains(text(),'Add Member')] | //button[contains(text(),'Add Family Member')]");
    this.memberNameInput = By.css('input[placeholder*="Name"], input[name="name"]');
    this.saveBtn = By.xpath("//button[contains(text(),'Save')]");
  }

  async openFamily() {
    await this.open('/family');
  }

  async isFamilyLoaded() {
    return (await ElementHelper.getCurrentUrl(this.driver)).includes('/family');
  }
}

module.exports = FamilyPage;
