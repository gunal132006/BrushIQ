const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const ElementHelper = require('../utils/helper');

class ReminderPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.addReminderBtn = By.xpath("//button[contains(text(),'Add Reminder')] | //button[contains(text(),'New Reminder')]");
    this.timeInput = By.css('input[type="time"]');
    this.saveBtn = By.xpath("//button[contains(text(),'Save')]");
  }

  async openReminders() {
    await this.open('/reminders');
  }

  async isRemindersLoaded() {
    return (await ElementHelper.getCurrentUrl(this.driver)).includes('/reminders');
  }
}

module.exports = ReminderPage;
