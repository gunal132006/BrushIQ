# BrushIQ Selenium End-to-End (E2E) Testing Framework

Production-ready, highly modular Selenium WebDriver E2E testing framework designed for the **BrushIQ** AI oral healthcare web application.

---

## 📐 Framework Architecture & Page Object Model (POM)

This framework adopts the Page Object Model (POM) pattern to isolate page interaction logic from test assertions, ensuring high test maintainability and DRY principles.

```text
selenium-tests/
│
├── package.json                   # Project dependencies and script shortcuts
├── README.md                      # Framework documentation & guides
├── .gitignore                     # Git exclusion rules
├── run-tests.js                   # Master test suite runner & report orchestrator
│
├── config/
│   ├── config.js                  # Global configuration & path resolutions
│   ├── browser.js                 # Chrome options & browser capabilities
│   └── environment.js             # Base URLs, timeouts, & test credentials
│
├── pages/                         # Page Object Model (POM) Classes
│   ├── BasePage.js                # Common page methods & layout navigation
│   ├── LoginPage.js               # Login page locators & form interactions
│   ├── RegisterPage.js            # Registration page locators & actions
│   ├── ForgotPasswordPage.js      # Password recovery page locators
│   ├── DashboardPage.js           # Dashboard metrics & navigation
│   ├── ToothbrushPage.js          # Toothbrush inventory management
│   ├── ScanPage.js                # AI toothbrush scan workflow
│   ├── HistoryPage.js             # Scan history & filtering
│   ├── ProfilePage.js             # User profile settings
│   ├── SettingsPage.js            # App theme & preferences
│   ├── ReminderPage.js           # Brushing reminder schedules
│   ├── AnalyticsPage.js           # Analytics & AI insights
│   └── FamilyPage.js              # Family profile management
│
├── tests/                         # Test Suites (300 Test Cases Total)
│   ├── login-tests.js             # TC_LOG_001 to TC_LOG_030
│   ├── register-tests.js          # TC_REG_001 to TC_REG_030
│   ├── forgot-password-tests.js   # TC_FGP_001 to TC_FGP_020
│   ├── dashboard-tests.js         # TC_DSH_001 to TC_DSH_030
│   ├── toothbrush-tests.js        # TC_TB_001 to TC_TB_025
│   ├── scan-tests.js              # TC_SCN_001 to TC_SCN_030
│   ├── history-tests.js           # TC_HST_001 to TC_HST_025
│   ├── profile-tests.js           # TC_PRF_001 to TC_PRF_030
│   ├── settings-tests.js          # TC_SET_001 to TC_SET_025
│   ├── reminder-tests.js          # TC_REM_001 to TC_REM_025
│   ├── analytics-tests.js         # TC_ANL_001 to TC_ANL_025
│   └── logout-tests.js            # TC_LGT_001 to TC_LGT_015
│
├── utils/
│   ├── driver.js                  # WebDriver lifecycle manager
│   ├── helper.js                  # Explicit wait & DOM helper utility
│   ├── logger.js                  # Structured file & console logger
│   ├── screenshot.js              # Automatic failure screenshot capturer
│   ├── testData.js                # Test data inputs & mock matrices
│   ├── constants.js               # Enums, statuses, priorities, severities
│   ├── testCaseRegistry.js        # 300 test case specification registry
│   ├── generateTestCasesExcel.js  # Generator for master test case Excel
│   ├── excelReport.js             # 4-Sheet Excel summary generator
│   ├── htmlReport.js              # Interactive HTML report generator
│   └── markdownReport.js          # Markdown execution summary generator
│
├── reports/                       # Generated Output Artifacts
│   ├── html/
│   │   └── index.html             # Interactive HTML Dashboard
│   ├── screenshots/               # Failure & evidence screenshots
│   ├── logs/
│   │   └── execution.log          # Detailed execution log
│   ├── selenium-summary.xlsx      # 4-Sheet Excel summary
│   └── execution-summary.md       # Markdown summary
│
└── test-cases/
    └── selenium-test-cases.xlsx   # 300 Test Cases Specification Workbook
```

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js**: v18.0.0 or higher.
2. **Google Chrome Browser**: Installed on host machine.
3. **BrushIQ Web Frontend**: Running at `http://localhost:5173`.

### Installation

Navigate to the `selenium-tests` directory and install dependencies:

```bash
cd selenium-tests
npm install
```

---

## 🏃 Running Tests

### Run All 300 Test Cases

```bash
npm test
```

### Run Specific Test Suites

```bash
# Run Login Suite
npm run test:login

# Run Registration Suite
npm run test:register

# Run Dashboard Suite
npm run test:dashboard

# Run Scan Workflow Suite
npm run test:scan

# Run History Suite
npm run test:history

# Run Profile Suite
npm run test:profile

# Run Settings Suite
npm run test:settings

# Run Reminders Suite
npm run test:reminders

# Run Toothbrush Management Suite
npm run test:toothbrush

# Run Analytics Suite
npm run test:analytics
```

---

## 📊 Reports & Output Deliverables

After test execution, reports are automatically generated in `selenium-tests/reports/`:

1. **`reports/selenium-summary.xlsx`**:
   - **Sheet 1**: Executive Summary (Metrics, Pass Rate, Browser, Duration).
   - **Sheet 2**: Detailed Test Cases (300 rows with ID, Module, Steps, Expected & Actual Result, Status, Priority, Severity).
   - **Sheet 3**: Failed Tests (Error stack trace, screenshot link, timestamp).
   - **Sheet 4**: Execution Logs (Detailed timestamped test run logs).

2. **`test-cases/selenium-test-cases.xlsx`**:
   - Master reference spreadsheet of all 300 test case specifications.

3. **`reports/html/index.html`**:
   - Interactive HTML report featuring test filters, search bar, duration metrics, and status badges.

4. **`reports/execution-summary.md`**:
   - Markdown summary table suitable for GitHub Pull Requests or documentation artifacts.

5. **`reports/screenshots/`**:
   - Screenshots captured automatically upon test failures.

---

## 🛠️ Troubleshooting

1. **ChromeDriver Version Mismatch**: Ensure your installed Google Chrome matches `chromedriver` major version.
2. **Port Conflict**: If `http://localhost:5173` is not accessible, update `config/environment.js` with your active port.
3. **Headless vs Headed Mode**: To observe browser execution in visual GUI mode, set `HEADLESS=false` in environment variables:
   ```bash
   HEADLESS=false npm test
   ```
