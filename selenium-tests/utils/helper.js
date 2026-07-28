const { By, until } = require('selenium-webdriver');
const config = require('../config/config');
const logger = require('./logger');

class ElementHelper {
  static async waitForElement(driver, locator, timeout = config.env.timeout) {
    try {
      const element = await driver.wait(until.elementLocated(locator), timeout);
      await driver.wait(until.elementIsVisible(element), timeout);
      return element;
    } catch (err) {
      logger.warn(`Element not located or visible: ${locator.toString()}`);
      throw err;
    }
  }

  static async click(driver, locator, timeout = config.env.timeout) {
    try {
      const element = await this.waitForElement(driver, locator, timeout);
      await driver.wait(until.elementIsEnabled(element), timeout);
      await element.click();
    } catch (err) {
      logger.warn(`Click failed on ${locator.toString()}, attempting JS click...`);
      const element = await driver.findElement(locator);
      await driver.executeScript('arguments[0].click();', element);
    }
  }

  static async type(driver, locator, text, clearFirst = true, timeout = config.env.timeout) {
    const element = await this.waitForElement(driver, locator, timeout);
    if (clearFirst) {
      await element.clear();
    }
    await element.sendKeys(text);
  }

  static async getText(driver, locator, timeout = config.env.timeout) {
    try {
      const element = await this.waitForElement(driver, locator, timeout);
      return await element.getText();
    } catch (err) {
      return '';
    }
  }

  static async isDisplayed(driver, locator, timeout = 3000) {
    try {
      const element = await driver.wait(until.elementLocated(locator), timeout);
      return await element.isDisplayed();
    } catch (err) {
      return false;
    }
  }

  static async getValue(driver, locator, timeout = config.env.timeout) {
    const element = await this.waitForElement(driver, locator, timeout);
    return await element.getAttribute('value');
  }

  static async navigateTo(driver, path) {
    const fullUrl = path.startsWith('http') ? path : `${config.env.baseUrl}${path}`;
    logger.info(`Navigating to: ${fullUrl}`);
    await driver.get(fullUrl);
  }

  static async getCurrentUrl(driver) {
    return await driver.getCurrentUrl();
  }

  static async setLocalStorage(driver, key, value) {
    const stringVal = typeof value === 'object' ? JSON.stringify(value) : value;
    await driver.executeScript(`window.localStorage.setItem(arguments[0], arguments[1]);`, key, stringVal);
  }

  static async getLocalStorage(driver, key) {
    return await driver.executeScript(`return window.localStorage.getItem(arguments[0]);`, key);
  }

  static async clearLocalStorage(driver) {
    await driver.executeScript('window.localStorage.clear();');
  }

  static async scrollIntoView(driver, locator) {
    const element = await this.waitForElement(driver, locator);
    await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', element);
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ElementHelper;
