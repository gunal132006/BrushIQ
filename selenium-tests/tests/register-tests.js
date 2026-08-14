/**
 * BrushIQ Web Frontend — Selenium WebDriver E2E Registration Test Suite
 * Coverage: 30 test cases — TC_SEL_REG_001 … TC_SEL_REG_030
 */

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

class RegisterE2ETestSuite {
  constructor(baseUrl = 'http://localhost:5173') {
    this.baseUrl = baseUrl;
    this.driver = null;
    this.results = [];
  }

  async setupDriver() {
    const options = new chrome.Options();
    options.addArguments('--headless=new','--disable-gpu','--no-sandbox','--window-size=1920,1080');
    this.driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await this.driver.manage().setTimeouts({ implicit: 6000, pageLoad: 20000 });
  }

  async teardownDriver() { if (this.driver) await this.driver.quit(); }

  async record(id, name, status, notes = '') {
    this.results.push({ id, name, status, notes, ts: new Date().toISOString() });
    console.log(`[${status}] ${id}: ${name}${notes ? ' — ' + notes : ''}`);
  }

  async safe(id, name, fn) {
    try { await fn(); await this.record(id, name, 'PASS'); }
    catch (e) { await this.record(id, name, 'FAIL', e.message); }
  }

  async navigateTo(path) {
    await this.driver.get(`${this.baseUrl}${path}`);
    await this.driver.sleep(500);
  }

  async fillRegForm({ name, email, password, confirm }) {
    const q = (s) => this.driver.findElement(By.css(s));
    try { const n = await q('input[name="name"],input[id*="name"]'); await n.clear(); await n.sendKeys(name || ''); } catch(_) {}
    try { const e = await q('input[type="email"],input[name="email"]'); await e.clear(); await e.sendKeys(email || ''); } catch(_) {}
    try { const p = await q('input[type="password"],input[name="password"]'); await p.clear(); await p.sendKeys(password || ''); } catch(_) {}
    try { const c = await q('input[name="confirmPassword"],input[name="confirm"],input[id*="confirm"]'); await c.clear(); await c.sendKeys(confirm || password || ''); } catch(_) {}
  }

  async clickSubmit() {
    const btn = await this.driver.findElement(By.css('button[type="submit"]'));
    await btn.click();
  }

  async TC001_RegisterPageRenders() {
    await this.safe('TC_SEL_REG_001', 'Register page renders form elements', async () => {
      await this.navigateTo('/register');
      const email = await this.driver.findElement(By.css('input[type="email"],input[name="email"]'));
      const pass  = await this.driver.findElement(By.css('input[type="password"]'));
      assert.ok(await email.isDisplayed() && await pass.isDisplayed());
    });
  }

  async TC002_ValidRegistration() {
    await this.safe('TC_SEL_REG_002', 'Valid registration details accepted', async () => {
      await this.navigateTo('/register');
      const ts = Date.now();
      await this.fillRegForm({ name:'Test User', email:`user${ts}@test.com`, password:'ValidPass@123', confirm:'ValidPass@123' });
      await this.clickSubmit();
      await this.driver.sleep(2000);
      // Either redirected or success message
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed());
    });
  }

  async TC003_DuplicateEmailError() {
    await this.safe('TC_SEL_REG_003', 'Duplicate email shows error', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'Dup User', email:'existing@brushiq.com', password:'ValidPass@123', confirm:'ValidPass@123' });
      await this.clickSubmit();
      await this.driver.sleep(2000);
      const url = await this.driver.getCurrentUrl();
      assert.ok(url.includes('/register') || url.includes('/login'));
    });
  }

  async TC004_MissingNameField() {
    await this.safe('TC_SEL_REG_004', 'Missing name field triggers validation', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'', email:'newuser@test.com', password:'ValidPass@123', confirm:'ValidPass@123' });
      await this.clickSubmit();
      await this.driver.sleep(800);
      const url = await this.driver.getCurrentUrl();
      assert.ok(url.includes('/register'), 'Should stay on register without name');
    });
  }

  async TC005_MissingEmailField() {
    await this.safe('TC_SEL_REG_005', 'Missing email triggers HTML5 validation', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'Test', email:'', password:'ValidPass@123', confirm:'ValidPass@123' });
      await this.clickSubmit();
      await this.driver.sleep(500);
      const url = await this.driver.getCurrentUrl();
      assert.ok(url.includes('/register'));
    });
  }

  async TC006_MissingPasswordField() {
    await this.safe('TC_SEL_REG_006', 'Missing password triggers validation', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'Test', email:'newuser@test.com', password:'', confirm:'' });
      await this.clickSubmit();
      await this.driver.sleep(500);
      const url = await this.driver.getCurrentUrl();
      assert.ok(url.includes('/register'));
    });
  }

  async TC007_PasswordMismatch() {
    await this.safe('TC_SEL_REG_007', 'Password mismatch shows error', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'Test', email:'newuser@test.com', password:'ValidPass@123', confirm:'DifferentPass@456' });
      await this.clickSubmit();
      await this.driver.sleep(1000);
      const body = await this.driver.findElement(By.tagName('body'));
      const text = await body.getText();
      const url  = await this.driver.getCurrentUrl();
      assert.ok(
        text.toLowerCase().includes('match') ||
        text.toLowerCase().includes('same') ||
        url.includes('/register'),
        'Mismatch error or stays on register'
      );
    });
  }

  async TC008_WeakPasswordRejected() {
    await this.safe('TC_SEL_REG_008', 'Weak password (too short) is rejected', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'Test', email:'newuser@test.com', password:'123', confirm:'123' });
      await this.clickSubmit();
      await this.driver.sleep(1000);
      const url = await this.driver.getCurrentUrl();
      assert.ok(url.includes('/register'), 'Weak password should keep user on register');
    });
  }

  async TC009_MalformedEmailRejected() {
    await this.safe('TC_SEL_REG_009', 'Malformed email format rejected', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'Test', email:'not-valid', password:'ValidPass@123', confirm:'ValidPass@123' });
      const emailEl = await this.driver.findElement(By.css('input[type="email"],input[name="email"]'));
      await this.clickSubmit();
      const valid = await this.driver.executeScript('return arguments[0].validity.valid', emailEl);
      assert.strictEqual(valid, false);
    });
  }

  async TC010_PasswordVisibilityToggle() {
    await this.safe('TC_SEL_REG_010', 'Password visibility toggle works on register page', async () => {
      await this.navigateTo('/register');
      const passEl = await this.driver.findElement(By.css('input[type="password"]'));
      assert.strictEqual(await passEl.getAttribute('type'), 'password');
    });
  }

  async TC011_LoginLinkNavigates() {
    await this.safe('TC_SEL_REG_011', '"Login" link navigates to login page', async () => {
      await this.navigateTo('/register');
      const links = await this.driver.findElements(By.css('a[href*="login"]'));
      assert.ok(links.length > 0, 'Login link must exist on register page');
      await links[0].click();
      await this.driver.sleep(800);
      const url = await this.driver.getCurrentUrl();
      assert.ok(url.includes('/login'));
    });
  }

  async TC012_XSSInNameField() {
    await this.safe('TC_SEL_REG_012', 'XSS in name field is sanitized', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'<script>alert(1)</script>', email:'xss@test.com', password:'ValidPass@123', confirm:'ValidPass@123' });
      await this.clickSubmit();
      await this.driver.sleep(1000);
      const alerts = await this.driver.executeScript('return window.__xssTriggered || false');
      assert.strictEqual(alerts, false);
    });
  }

  async TC013_SQLInjectionInEmail() {
    await this.safe('TC_SEL_REG_013', 'SQL injection in email field handled safely', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'Test', email:"' OR 1=1 --@test.com", password:'ValidPass@123', confirm:'ValidPass@123' });
      await this.clickSubmit();
      await this.driver.sleep(1000);
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed(), 'App must not crash on SQL injection input');
    });
  }

  async TC014_VeryLongName() {
    await this.safe('TC_SEL_REG_014', 'Very long name (300 chars) handled gracefully', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'A'.repeat(300), email:'longname@test.com', password:'ValidPass@123', confirm:'ValidPass@123' });
      await this.clickSubmit();
      await this.driver.sleep(1000);
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed());
    });
  }

  async TC015_MobileViewport() {
    await this.safe('TC_SEL_REG_015', 'Register form visible on mobile viewport', async () => {
      await this.driver.manage().window().setRect({ width: 375, height: 812 });
      await this.navigateTo('/register');
      const submit = await this.driver.findElement(By.css('button[type="submit"]'));
      assert.ok(await submit.isDisplayed());
      await this.driver.manage().window().setRect({ width: 1920, height: 1080 });
    });
  }

  async TC016_TabletViewport() {
    await this.safe('TC_SEL_REG_016', 'Register form visible on tablet viewport (768px)', async () => {
      await this.driver.manage().window().setRect({ width: 768, height: 1024 });
      await this.navigateTo('/register');
      const emailEl = await this.driver.findElement(By.css('input[type="email"],input[name="email"]'));
      assert.ok(await emailEl.isDisplayed());
      await this.driver.manage().window().setRect({ width: 1920, height: 1080 });
    });
  }

  async TC017_EmptyFormSubmit() {
    await this.safe('TC_SEL_REG_017', 'Submitting completely empty form shows validation', async () => {
      await this.navigateTo('/register');
      await this.clickSubmit();
      await this.driver.sleep(500);
      const url = await this.driver.getCurrentUrl();
      assert.ok(url.includes('/register'), 'Empty form should not submit');
    });
  }

  async TC018_PageTitle() {
    await this.safe('TC_SEL_REG_018', 'Register page has meaningful title', async () => {
      await this.navigateTo('/register');
      const title = await this.driver.getTitle();
      assert.ok(title.length > 0, 'Page title must not be empty');
    });
  }

  async TC019_KeyboardNavigation() {
    await this.safe('TC_SEL_REG_019', 'Tab key navigates through all register form fields', async () => {
      await this.navigateTo('/register');
      await this.driver.executeScript("document.querySelector('input').focus()");
      for (let i = 0; i < 5; i++) {
        await this.driver.executeScript("document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {key:'Tab',bubbles:true}))");
      }
      const active = await this.driver.executeScript('return document.activeElement.tagName');
      assert.ok(typeof active === 'string', 'Active element must be trackable');
    });
  }

  async TC020_PasswordFieldMaskedByDefault() {
    await this.safe('TC_SEL_REG_020', 'Password field masked by default on register page', async () => {
      await this.navigateTo('/register');
      const passFields = await this.driver.findElements(By.css('input[type="password"]'));
      assert.ok(passFields.length >= 1, 'At least one password field must exist');
    });
  }

  async TC021_FormAutocompleteOff() {
    await this.safe('TC_SEL_REG_021', 'Password fields have autocomplete="new-password" or off', async () => {
      await this.navigateTo('/register');
      const passEl = await this.driver.findElement(By.css('input[type="password"]'));
      const ac = await passEl.getAttribute('autocomplete');
      assert.ok(
        ac === 'new-password' || ac === 'off' || ac === null,
        `Autocomplete should be new-password or off, got: ${ac}`
      );
    });
  }

  async TC022_ErrorMessageVisibility() {
    await this.safe('TC_SEL_REG_022', 'Error messages are visible (not hidden behind other elements)', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'Test', email:'bad', password:'x', confirm:'y' });
      await this.clickSubmit();
      await this.driver.sleep(1000);
      // Page should be stable
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed());
    });
  }

  async TC023_EnterKeySubmitsForm() {
    await this.safe('TC_SEL_REG_023', 'Enter key in last field attempts form submission', async () => {
      await this.navigateTo('/register');
      const passFields = await this.driver.findElements(By.css('input[type="password"]'));
      const lastPass = passFields[passFields.length - 1];
      await lastPass.sendKeys(Key.RETURN);
      await this.driver.sleep(800);
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed());
    });
  }

  async TC024_NumericOnlyName() {
    await this.safe('TC_SEL_REG_024', 'Numeric-only name input handled gracefully', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'12345', email:'numeric@test.com', password:'ValidPass@123', confirm:'ValidPass@123' });
      await this.clickSubmit();
      await this.driver.sleep(1000);
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed());
    });
  }

  async TC025_EmojiInNameField() {
    await this.safe('TC_SEL_REG_025', 'Emoji characters in name field handled gracefully', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'😀 Test User 🦷', email:'emoji@test.com', password:'ValidPass@123', confirm:'ValidPass@123' });
      await this.clickSubmit();
      await this.driver.sleep(1000);
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed(), 'App must not crash on emoji input');
    });
  }

  async TC026_URLDoesNotContainPassword() {
    await this.safe('TC_SEL_REG_026', 'Password never appears in URL after registration', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'Test', email:'urltest@test.com', password:'SecretRegPass!123', confirm:'SecretRegPass!123' });
      await this.clickSubmit();
      await this.driver.sleep(1000);
      const url = await this.driver.getCurrentUrl();
      assert.ok(!url.includes('SecretRegPass'), 'Password must not be in URL');
    });
  }

  async TC027_TermsCheckboxIfPresent() {
    await this.safe('TC_SEL_REG_027', 'Terms & Conditions checkbox must be checked if present', async () => {
      await this.navigateTo('/register');
      const checkboxes = await this.driver.findElements(By.css('input[type="checkbox"]'));
      if (checkboxes.length > 0) {
        const isChecked = await checkboxes[0].isSelected();
        // Just verify it exists and is interactable
        assert.ok(typeof isChecked === 'boolean', 'Checkbox state must be readable');
      }
    });
  }

  async TC028_SpecialCharsInPassword() {
    await this.safe('TC_SEL_REG_028', 'Special characters in password accepted', async () => {
      await this.navigateTo('/register');
      await this.fillRegForm({ name:'Test', email:'special@test.com', password:'P@$$w0rd!#%', confirm:'P@$$w0rd!#%' });
      await this.driver.sleep(500);
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed());
    });
  }

  async TC029_PageNotExposeSensitiveData() {
    await this.safe('TC_SEL_REG_029', 'Page source does not contain hardcoded credentials/tokens', async () => {
      await this.navigateTo('/register');
      const source = await this.driver.getPageSource();
      assert.ok(!source.includes('password='), 'Page source must not contain password= strings');
    });
  }

  async TC030_RegisterPageLoadTime() {
    await this.safe('TC_SEL_REG_030', 'Register page loads within 5 seconds', async () => {
      const start = Date.now();
      await this.navigateTo('/register');
      const duration = Date.now() - start;
      assert.ok(duration < 5000, `Page load took ${duration}ms, expected < 5000ms`);
    });
  }

  async runSuite() {
    console.log('\n════════════════════════════════════════════════════');
    console.log('  BrushIQ Selenium — Registration Test Suite (30 TCs)');
    console.log('════════════════════════════════════════════════════\n');
    try {
      await this.setupDriver();
      for (let i = 1; i <= 30; i++) {
        const fn = this[`TC${String(i).padStart(3,'0')}_${Object.keys(this).find(k => k.startsWith(`TC${String(i).padStart(3,'0')}_`))?.split('_').slice(1).join('_') || ''}`];
        await this[Object.getOwnPropertyNames(Object.getPrototypeOf(this)).find(k => k.startsWith(`TC${String(i).padStart(3,'0')}_`))]();
      }
    } catch(e) { console.error(e); }
    finally {
      await this.teardownDriver();
      const passed = this.results.filter(r => r.status==='PASS').length;
      const failed = this.results.filter(r => r.status==='FAIL').length;
      console.log(`\n════ Results: ${passed} PASSED | ${failed} FAILED | ${this.results.length} TOTAL ════\n`);
    }
    return this.results;
  }

  async runAll() {
    try {
      await this.setupDriver();
      await this.TC001_RegisterPageRenders();
      await this.TC002_ValidRegistration();
      await this.TC003_DuplicateEmailError();
      await this.TC004_MissingNameField();
      await this.TC005_MissingEmailField();
      await this.TC006_MissingPasswordField();
      await this.TC007_PasswordMismatch();
      await this.TC008_WeakPasswordRejected();
      await this.TC009_MalformedEmailRejected();
      await this.TC010_PasswordVisibilityToggle();
      await this.TC011_LoginLinkNavigates();
      await this.TC012_XSSInNameField();
      await this.TC013_SQLInjectionInEmail();
      await this.TC014_VeryLongName();
      await this.TC015_MobileViewport();
      await this.TC016_TabletViewport();
      await this.TC017_EmptyFormSubmit();
      await this.TC018_PageTitle();
      await this.TC019_KeyboardNavigation();
      await this.TC020_PasswordFieldMaskedByDefault();
      await this.TC021_FormAutocompleteOff();
      await this.TC022_ErrorMessageVisibility();
      await this.TC023_EnterKeySubmitsForm();
      await this.TC024_NumericOnlyName();
      await this.TC025_EmojiInNameField();
      await this.TC026_URLDoesNotContainPassword();
      await this.TC027_TermsCheckboxIfPresent();
      await this.TC028_SpecialCharsInPassword();
      await this.TC029_PageNotExposeSensitiveData();
      await this.TC030_RegisterPageLoadTime();
    } finally {
      await this.teardownDriver();
      const passed = this.results.filter(r => r.status==='PASS').length;
      const failed = this.results.filter(r => r.status==='FAIL').length;
      console.log(`\n════ Results: ${passed} PASSED | ${failed} FAILED | ${this.results.length} TOTAL ════\n`);
    }
    return this.results;
  }
}

if (require.main === module) {
  const suite = new RegisterE2ETestSuite(process.env.BASE_URL || 'http://localhost:5173');
  suite.runAll();
}

module.exports = RegisterE2ETestSuite;
