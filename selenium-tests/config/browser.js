/**
 * Browser capabilities and driver configuration options
 */
module.exports = {
  chrome: {
    browserName: 'chrome',
    headless: process.env.HEADLESS !== 'false', // Default to true unless explicitly turned off
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,1024',
      '--allow-file-access-from-files',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  }
};
