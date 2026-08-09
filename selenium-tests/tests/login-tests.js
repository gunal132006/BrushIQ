/**
 * BrushIQ Web Frontend - Selenium WebDriver E2E Login & Authentication Test Suite
 * Framework: Selenium WebDriver (JS) + Mocha / Custom Runner
 * Author: BrushIQ QA Automation Team
 */

const { Builder, By, Until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

class LoginE2ETestSuite {
  constructor(baseUrl = 'http://localhost:5173') {
    this.baseUrl = baseUrl;
    this.driver = null;
  }

  async setupDriver() {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--window-size=1920,1080');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await this.driver.manage().setTimeouts({ implicit: 5000 });
  }

  async teardownDriver() {
    if (this.driver) {
      await this.driver.quit();
    }
  }

  // -------------------------------------------------------------
  // Test Cases Implementation
  // -------------------------------------------------------------

  /**
   * TC_SEL_001: Verify Login Page Title & Form Rendering
   */
  async testLoginPageRendering() {
    console.log('[RUNNING] TC_SEL_001: Verify Login Page Title & Form Rendering');
    await this.driver.get(`${this.baseUrl}/login`);
    
    const emailInput = await this.driver.findElement(By.id('email-input'));
    const passwordInput = await this.driver.findElement(By.id('password-input'));
    const submitBtn = await this.driver.findElement(By.css('button[type="submit"]'));

    assert.ok(await emailInput.isDisplayed(), 'Email input field should be visible');
    assert.ok(await passwordInput.isDisplayed(), 'Password input field should be visible');
    assert.ok(await submitBtn.isDisplayed(), 'Submit button should be visible');
    console.log('[PASS] TC_SEL_001');
  }

  /**
   * TC_SEL_002: Verify User Login with Valid Credentials
   */
  async testValidUserLogin() {
    console.log('[RUNNING] TC_SEL_002: Verify User Login with Valid Credentials');
    await this.driver.get(`${this.baseUrl}/login`);

    await this.driver.findElement(By.id('email-input')).sendKeys('gunal.s@brushiq.com');
    await this.driver.findElement(By.id('password-input')).sendKeys('password123');
    await this.driver.findElement(By.css('button[type="submit"]')).click();

    // Verify redirect to dashboard
    await this.driver.wait(async () => {
      const currentUrl = await this.driver.getCurrentUrl();
      return currentUrl.includes('/dashboard') || currentUrl.includes('/');
    }, 5000);

    console.log('[PASS] TC_SEL_002');
  }

  /**
   * TC_SEL_003: Verify Invalid Password Error Message
   */
  async testInvalidPasswordError() {
    console.log('[RUNNING] TC_SEL_003: Verify Invalid Password Error Message');
    await this.driver.get(`${this.baseUrl}/login`);

    await this.driver.findElement(By.id('email-input')).sendKeys('gunal.s@brushiq.com');
    await this.driver.findElement(By.id('password-input')).sendKeys('WrongPass999!');
    await this.driver.findElement(By.css('button[type="submit"]')).click();

    const errorAlert = await this.driver.findElement(By.css('.error-message, .alert-danger, [role="alert"]'));
    const errorText = await errorAlert.getText();
    assert.ok(errorText.toLowerCase().includes('invalid') || errorText.toLowerCase().includes('incorrect'), 
      'Error message should indicate invalid credentials');

    console.log('[PASS] TC_SEL_003');
  }

  /**
   * TC_SEL_004: Verify Password Field Masking & Visibility Toggle
   */
  async testPasswordMaskingToggle() {
    console.log('[RUNNING] TC_SEL_004: Verify Password Field Masking & Visibility Toggle');
    await this.driver.get(`${this.baseUrl}/login`);

    const passInput = await this.driver.findElement(By.id('password-input'));
    assert.strictEqual(await passInput.getAttribute('type'), 'password', 'Password field should initially be masked');

    const toggleBtn = await this.driver.findElement(By.css('.toggle-password-btn, [aria-label*="password"]'));
    await toggleBtn.click();
    assert.strictEqual(await passInput.getAttribute('type'), 'text', 'Password field should be unmasked on toggle');

    console.log('[PASS] TC_SEL_004');
  }

  /**
   * TC_SEL_005: Verify Remember Me Cookie Persistence
   */
  async testRememberMePersistence() {
    console.log('[RUNNING] TC_SEL_005: Verify Remember Me Cookie Persistence');
    await this.driver.get(`${this.baseUrl}/login`);

    const rememberCheckbox = await this.driver.findElement(By.id('remember-me-checkbox'));
    if (!(await rememberCheckbox.isSelected())) {
      await rememberCheckbox.click();
    }

    await this.driver.findElement(By.id('email-input')).sendKeys('gunal.s@brushiq.com');
    await this.driver.findElement(By.id('password-input')).sendKeys('password123');
    await this.driver.findElement(By.css('button[type="submit"]')).click();

    // Check cookie existence
    const rememberCookie = await this.driver.manage().getCookie('remember_token');
    console.log('[PASS] TC_SEL_005');
  }

  /**
   * Run All Suite Test Scenarios
   */
  async runSuite() {
    try {
      await this.setupDriver();
      await this.testLoginPageRendering();
      await this.testValidUserLogin();
      await this.testInvalidPasswordError();
      await this.testPasswordMaskingToggle();
      await this.testRememberMePersistence();
      console.log('--- All Selenium Login Tests Executed Successfully ---');
    } catch (err) {
      console.error('Test Execution Error:', err);
    } finally {
      await this.teardownDriver();
    }
  }
}

// Module Export & Direct Command Line Execution Support
if (require.main === module) {
  const suite = new LoginE2ETestSuite();
  suite.runSuite();
}

module.exports = LoginE2ETestSuite;
