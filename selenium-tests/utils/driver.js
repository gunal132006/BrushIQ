const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config/config');
const logger = require('./logger');

let driverInstance = null;

async function createDriver() {
  logger.info('Initializing Selenium WebDriver instance...');
  const options = new chrome.Options();

  // Add arguments
  config.browser.chrome.args.forEach(arg => options.addArguments(arg));

  if (config.browser.chrome.headless) {
    options.addArguments('--headless=new');
  }

  // Set binary if custom environment provided
  if (process.env.CHROME_BIN) {
    options.setChromeBinaryPath(process.env.CHROME_BIN);
  }

  driverInstance = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driverInstance.manage().setTimeouts({
    implicit: config.env.implicitWait,
    pageLoad: config.env.pageLoadTimeout
  });

  logger.info('WebDriver initialized successfully.');
  return driverInstance;
}

async function getDriver() {
  if (!driverInstance) {
    return await createDriver();
  }
  return driverInstance;
}

async function quitDriver(driverToQuit = null) {
  const target = driverToQuit || driverInstance;
  if (target) {
    try {
      logger.info('Closing WebDriver instance...');
      await target.quit();
      if (target === driverInstance) {
        driverInstance = null;
      }
      logger.info('WebDriver closed successfully.');
    } catch (err) {
      logger.error('Error while quitting WebDriver', err);
    }
  }
}

module.exports = {
  createDriver,
  getDriver,
  quitDriver
};
