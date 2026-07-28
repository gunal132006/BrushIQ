const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');
const logger = require('./logger');

class ScreenshotUtility {
  constructor() {
    fs.ensureDirSync(config.paths.screenshots);
  }

  async capture(driver, testId) {
    if (!driver) return null;
    try {
      const sanitizedId = (testId || 'test').replace(/[^a-zA-Z0-9_-]/g, '_');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${sanitizedId}_${timestamp}.png`;
      const filePath = path.join(config.paths.screenshots, fileName);

      const image = await driver.takeScreenshot();
      await fs.writeFile(filePath, image, 'base64');
      logger.info(`Screenshot captured for ${testId}: ${fileName}`);
      
      // Return relative path for reports
      return path.relative(config.paths.reports, filePath).replace(/\\/g, '/');
    } catch (err) {
      logger.error(`Failed to capture screenshot for ${testId}`, err);
      return null;
    }
  }
}

module.exports = new ScreenshotUtility();
