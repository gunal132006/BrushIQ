const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class ScanPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.uploadInput = By.css('input[type="file"]');
    this.uploadBox = By.xpath("//div[contains(text(),'Click to Upload')] | //label[contains(text(),'Upload')] | //input[@type='file']");
    this.cameraBtn = By.xpath("//button[contains(text(),'Use Camera')] | //button[contains(text(),'Capture')]");
    this.analyzeBtn = By.xpath("//button[contains(text(),'Analyze')] | //button[contains(text(),'Run AI Analysis')]");
    this.resultContainer = By.xpath("//h2[contains(text(),'Scan Result')] | //div[contains(text(),'Wear Score')]");
  }

  async openScan() {
    await this.open('/scan');
  }

  async uploadImageFile(filePath) {
    const fileInput = await ElementHelper.waitForElement(this.driver, this.uploadInput, 3000);
    await fileInput.sendKeys(filePath);
  }

  async clickAnalyze() {
    if (await ElementHelper.isDisplayed(this.driver, this.analyzeBtn, 3000)) {
      await ElementHelper.click(this.driver, this.analyzeBtn);
    }
  }

  async isScanPageLoaded() {
    return (await ElementHelper.getCurrentUrl(this.driver)).includes('/scan');
  }
}

module.exports = ScanPage;
