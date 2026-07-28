const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class ToothbrushPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.addBrushBtn = By.xpath("//button[contains(text(),'Add New Toothbrush')] | //button[contains(text(),'Add Toothbrush')]");
    this.brushNameInput = By.css('input[placeholder*="Name"], input[name="name"], #brushName');
    this.brandInput = By.css('input[placeholder*="Brand"], input[name="brand"], #brand');
    this.modelInput = By.css('input[placeholder*="Model"], input[name="model"], #model');
    this.saveBtn = By.xpath("//button[contains(text(),'Save')] | //button[contains(text(),'Add')]");
    this.brushList = By.css('.toothbrush-card, .border, .rounded-2xl');
    this.deleteBtn = By.xpath("//button[contains(text(),'Delete')] | //button[contains(@aria-label,'Delete')]");
  }

  async openToothbrushes() {
    await this.open('/toothbrushes');
  }

  async clickAddNew() {
    await ElementHelper.click(this.driver, this.addBrushBtn);
  }

  async fillBrushDetails(name, brand, model) {
    if (await ElementHelper.isDisplayed(this.driver, this.brushNameInput, 2000)) {
      if (name) await ElementHelper.type(this.driver, this.brushNameInput, name);
      if (brand) await ElementHelper.type(this.driver, this.brandInput, brand);
      if (model) await ElementHelper.type(this.driver, this.modelInput, model);
      await ElementHelper.click(this.driver, this.saveBtn);
    }
  }

  async isBrushPageLoaded() {
    return (await ElementHelper.getCurrentUrl(this.driver)).includes('/toothbrushes');
  }
}

module.exports = ToothbrushPage;
