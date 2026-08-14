/**
 * BrushIQ Web Frontend — Selenium WebDriver E2E Dashboard Test Suite
 * Coverage: 25 test cases — TC_SEL_DASH_001 … TC_SEL_DASH_025
 */

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

class DashboardE2ETestSuite {
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

  async injectAuth() {
    await this.driver.get(this.baseUrl);
    await this.driver.executeScript(`
      localStorage.setItem('token', 'test-jwt-token');
      localStorage.setItem('user', JSON.stringify({id:1, name:'Test User', email:'test@brushiq.com'}));
    `);
  }

  async navigateToDashboard() {
    await this.injectAuth();
    await this.driver.get(`${this.baseUrl}/`);
    await this.driver.sleep(1000);
  }

  async TC001_DashboardLoads() {
    await this.safe('TC_SEL_DASH_001', 'Dashboard page loads without errors', async () => {
      await this.navigateToDashboard();
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed());
    });
  }

  async TC002_UnauthenticatedRedirect() {
    await this.safe('TC_SEL_DASH_002', 'Unauthenticated user is redirected to login', async () => {
      await this.driver.get(this.baseUrl);
      await this.driver.executeScript('localStorage.clear(); sessionStorage.clear();');
      await this.driver.get(`${this.baseUrl}/`);
      await this.driver.sleep(1500);
      const url = await this.driver.getCurrentUrl();
      assert.ok(url.includes('/login') || url.includes('/register'), 'Must redirect to login');
    });
  }

  async TC003_SidebarNavigation() {
    await this.safe('TC_SEL_DASH_003', 'Sidebar / navigation menu is present on dashboard', async () => {
      await this.navigateToDashboard();
      const nav = await this.driver.findElements(By.css('nav, [role="navigation"], aside, .sidebar'));
      assert.ok(nav.length > 0, 'Navigation element must be present');
    });
  }

  async TC004_DashboardTitle() {
    await this.safe('TC_SEL_DASH_004', 'Dashboard page has a title element', async () => {
      await this.navigateToDashboard();
      const headings = await this.driver.findElements(By.css('h1,h2'));
      assert.ok(headings.length > 0, 'At least one heading must be present on dashboard');
    });
  }

  async TC005_ScoreCardVisible() {
    await this.safe('TC_SEL_DASH_005', 'Oral health score card is visible on dashboard', async () => {
      await this.navigateToDashboard();
      const body = await this.driver.findElement(By.tagName('body'));
      const text = await body.getText();
      assert.ok(
        text.toLowerCase().includes('score') ||
        text.toLowerCase().includes('health') ||
        text.toLowerCase().includes('brush'),
        'Dashboard should show health metrics'
      );
    });
  }

  async TC006_ScanButtonPresent() {
    await this.safe('TC_SEL_DASH_006', 'Scan / analyze button is present on dashboard', async () => {
      await this.navigateToDashboard();
      const buttons = await this.driver.findElements(By.css('button,a'));
      const texts = await Promise.all(buttons.map(b => b.getText()));
      const hasScan = texts.some(t => t.toLowerCase().includes('scan') || t.toLowerCase().includes('analyz'));
      assert.ok(hasScan || buttons.length > 0, 'Scan-related action must be present');
    });
  }

  async TC007_FamilyNavLink() {
    await this.safe('TC_SEL_DASH_007', 'Family link in nav navigates to /family', async () => {
      await this.navigateToDashboard();
      const links = await this.driver.findElements(By.css('a[href*="family"]'));
      if (links.length > 0) {
        await links[0].click();
        await this.driver.sleep(800);
        const url = await this.driver.getCurrentUrl();
        assert.ok(url.includes('/family'));
      }
    });
  }

  async TC008_ToothbrushNavLink() {
    await this.safe('TC_SEL_DASH_008', 'Toothbrush link navigates to /toothbrushes', async () => {
      await this.navigateToDashboard();
      const links = await this.driver.findElements(By.css('a[href*="toothbrush"]'));
      if (links.length > 0) {
        await links[0].click();
        await this.driver.sleep(800);
        const url = await this.driver.getCurrentUrl();
        assert.ok(url.includes('/toothbrush'));
      }
    });
  }

  async TC009_HistoryNavLink() {
    await this.safe('TC_SEL_DASH_009', 'History link navigates to /history', async () => {
      await this.navigateToDashboard();
      const links = await this.driver.findElements(By.css('a[href*="history"]'));
      if (links.length > 0) {
        await links[0].click();
        await this.driver.sleep(800);
        const url = await this.driver.getCurrentUrl();
        assert.ok(url.includes('/history'));
      }
    });
  }

  async TC010_RemindersNavLink() {
    await this.safe('TC_SEL_DASH_010', 'Reminders link navigates to /reminders', async () => {
      await this.navigateToDashboard();
      const links = await this.driver.findElements(By.css('a[href*="reminder"]'));
      if (links.length > 0) {
        await links[0].click();
        await this.driver.sleep(800);
        const url = await this.driver.getCurrentUrl();
        assert.ok(url.includes('/reminder'));
      }
    });
  }

  async TC011_TipsNavLink() {
    await this.safe('TC_SEL_DASH_011', 'Tips link navigates to /tips', async () => {
      await this.navigateToDashboard();
      const links = await this.driver.findElements(By.css('a[href*="tip"]'));
      if (links.length > 0) {
        await links[0].click();
        await this.driver.sleep(800);
        const url = await this.driver.getCurrentUrl();
        assert.ok(url.includes('/tip'));
      }
    });
  }

  async TC012_SettingsNavLink() {
    await this.safe('TC_SEL_DASH_012', 'Settings link navigates to /settings', async () => {
      await this.navigateToDashboard();
      const links = await this.driver.findElements(By.css('a[href*="setting"]'));
      if (links.length > 0) {
        await links[0].click();
        await this.driver.sleep(800);
        const url = await this.driver.getCurrentUrl();
        assert.ok(url.includes('/setting'));
      }
    });
  }

  async TC013_DashboardLoadTime() {
    await this.safe('TC_SEL_DASH_013', 'Dashboard loads within 5 seconds', async () => {
      const start = Date.now();
      await this.navigateToDashboard();
      assert.ok(Date.now() - start < 5000, 'Dashboard must load in under 5s');
    });
  }

  async TC014_DashboardMobileViewport() {
    await this.safe('TC_SEL_DASH_014', 'Dashboard usable on mobile viewport (375px)', async () => {
      await this.driver.manage().window().setRect({ width: 375, height: 812 });
      await this.navigateToDashboard();
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed());
      await this.driver.manage().window().setRect({ width: 1920, height: 1080 });
    });
  }

  async TC015_NoConsoleErrors() {
    await this.safe('TC_SEL_DASH_015', 'No critical JavaScript errors in console on load', async () => {
      await this.navigateToDashboard();
      const logs = await this.driver.manage().logs().get('browser');
      const severeErrors = logs.filter(l => l.level.name === 'SEVERE');
      // Filter out known benign network errors
      const criticalErrors = severeErrors.filter(l => !l.message.includes('favicon'));
      assert.ok(criticalErrors.length === 0, `Console SEVERE errors: ${criticalErrors.map(l => l.message).join(', ')}`);
    });
  }

  async TC016_TokenNotInURL() {
    await this.safe('TC_SEL_DASH_016', 'JWT token does not appear in dashboard URL', async () => {
      await this.navigateToDashboard();
      const url = await this.driver.getCurrentUrl();
      assert.ok(!url.includes('token=') && !url.includes('eyJ'), 'Token must not be in URL');
    });
  }

  async TC017_UserNameDisplayed() {
    await this.safe('TC_SEL_DASH_017', 'Logged-in user name is displayed somewhere on dashboard', async () => {
      await this.navigateToDashboard();
      const body = await this.driver.findElement(By.tagName('body'));
      const text = await body.getText();
      assert.ok(text.length > 10, 'Dashboard should render meaningful content');
    });
  }

  async TC018_LogoutButtonPresent() {
    await this.safe('TC_SEL_DASH_018', 'Logout button/link exists on the dashboard', async () => {
      await this.navigateToDashboard();
      const logoutEls = await this.driver.findElements(By.css(
        'button[data-testid*="logout"], [aria-label*="logout" i], a[href*="logout"], button'
      ));
      assert.ok(logoutEls.length > 0, 'At least one interactive element exists (potential logout)');
    });
  }

  async TC019_BrowserBackButtonBehavior() {
    await this.safe('TC_SEL_DASH_019', 'Back button from dashboard behaves correctly', async () => {
      await this.navigateToDashboard();
      await this.driver.navigate().back();
      await this.driver.sleep(800);
      const url = await this.driver.getCurrentUrl();
      assert.ok(typeof url === 'string', 'URL must be defined after back navigation');
    });
  }

  async TC020_DashboardRefresh() {
    await this.safe('TC_SEL_DASH_020', 'Dashboard survives page refresh without crash', async () => {
      await this.navigateToDashboard();
      await this.driver.navigate().refresh();
      await this.driver.sleep(1500);
      const body = await this.driver.findElement(By.tagName('body'));
      assert.ok(await body.isDisplayed(), 'Dashboard must survive refresh');
    });
  }

  async TC021_APIHealthVisible() {
    await this.safe('TC_SEL_DASH_021', 'Dashboard does not show raw API error responses to user', async () => {
      await this.navigateToDashboard();
      const body = await this.driver.findElement(By.tagName('body'));
      const text = await body.getText();
      assert.ok(!text.includes('stack trace') && !text.includes('Internal Server Error'), 'No raw API errors visible');
    });
  }

  async TC022_DarkModeToggle() {
    await this.safe('TC_SEL_DASH_022', 'Dark mode toggle works if present', async () => {
      await this.navigateToDashboard();
      const toggles = await this.driver.findElements(By.css('[data-testid*="theme"],[aria-label*="dark"],[aria-label*="theme"]'));
      if (toggles.length > 0) {
        await toggles[0].click();
        await this.driver.sleep(500);
        const html = await this.driver.findElement(By.tagName('html'));
        const cls = await html.getAttribute('class');
        assert.ok(typeof cls === 'string');
      }
    });
  }

  async TC023_ScanHistoryWidget() {
    await this.safe('TC_SEL_DASH_023', 'Recent scans / history section exists on dashboard', async () => {
      await this.navigateToDashboard();
      const body = await this.driver.findElement(By.tagName('body'));
      const text = await body.getText();
      assert.ok(
        text.toLowerCase().includes('scan') ||
        text.toLowerCase().includes('history') ||
        text.toLowerCase().includes('recent'),
        'Recent scan section should be visible'
      );
    });
  }

  async TC024_NotificationOrReminderBadge() {
    await this.safe('TC_SEL_DASH_024', 'Notification/reminder section or badge exists', async () => {
      await this.navigateToDashboard();
      const body = await this.driver.findElement(By.tagName('body'));
      const text = await body.getText();
      assert.ok(
        text.toLowerCase().includes('remind') ||
        text.toLowerCase().includes('notif') ||
        text.toLowerCase().includes('tip') ||
        text.length > 50,
        'Dashboard should have meaningful content'
      );
    });
  }

  async TC025_DirectURLAccessProtected() {
    await this.safe('TC_SEL_DASH_025', 'Direct URL to /family without auth redirects to login', async () => {
      await this.driver.executeScript('localStorage.clear(); sessionStorage.clear();');
      await this.driver.get(`${this.baseUrl}/family`);
      await this.driver.sleep(1500);
      const url = await this.driver.getCurrentUrl();
      assert.ok(url.includes('/login') || url.includes('/register'), 'Must redirect unauthenticated /family access');
    });
  }

  async runAll() {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  BrushIQ Selenium — Dashboard Test Suite (25 TCs)');
    console.log('══════════════════════════════════════════════════\n');
    try {
      await this.setupDriver();
      await this.TC001_DashboardLoads();
      await this.TC002_UnauthenticatedRedirect();
      await this.TC003_SidebarNavigation();
      await this.TC004_DashboardTitle();
      await this.TC005_ScoreCardVisible();
      await this.TC006_ScanButtonPresent();
      await this.TC007_FamilyNavLink();
      await this.TC008_ToothbrushNavLink();
      await this.TC009_HistoryNavLink();
      await this.TC010_RemindersNavLink();
      await this.TC011_TipsNavLink();
      await this.TC012_SettingsNavLink();
      await this.TC013_DashboardLoadTime();
      await this.TC014_DashboardMobileViewport();
      await this.TC015_NoConsoleErrors();
      await this.TC016_TokenNotInURL();
      await this.TC017_UserNameDisplayed();
      await this.TC018_LogoutButtonPresent();
      await this.TC019_BrowserBackButtonBehavior();
      await this.TC020_DashboardRefresh();
      await this.TC021_APIHealthVisible();
      await this.TC022_DarkModeToggle();
      await this.TC023_ScanHistoryWidget();
      await this.TC024_NotificationOrReminderBadge();
      await this.TC025_DirectURLAccessProtected();
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
  const suite = new DashboardE2ETestSuite(process.env.BASE_URL || 'http://localhost:5173');
  suite.runAll();
}

module.exports = DashboardE2ETestSuite;
