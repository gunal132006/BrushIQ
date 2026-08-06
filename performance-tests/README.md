# BrushIQ Performance & Baseline Load Testing Suite

This module contains **k6** load testing scripts and report generation utilities for evaluating the performance, throughput, response times, and failure rates of the **BrushIQ REST API** (`https://brushiq-backend.onrender.com`).

---

## 1. Directory Structure

```
performance-tests/
├── package.json
├── README.md
├── k6/
│   ├── config.js          # Target environment URL & default VUs setup
│   ├── baseline-test.js   # 100 VU 1-minute baseline load test
│   ├── auth-test.js       # Auth endpoints load test (/login, /register)
│   ├── scan-test.js       # AI Toothbrush scan endpoint load test
│   └── dashboard-test.js  # Dashboard analytics endpoints load test
├── reports/
│   ├── performance-summary.md
│   ├── performance-summary.xlsx
│   └── raw-results.json
└── generate-report.js     # Automated markdown & Excel report generator
```

---

## 2. Prerequisites

1. Install **k6**:
   - Windows (winget): `winget install k6` or `choco install k6`
   - macOS: `brew install k6`
   - Linux: `sudo apt-get install k6`
2. Install Node.js dependencies:
   ```bash
   cd performance-tests
   npm install
   ```

---

## 3. Running Load Tests

### Run Baseline Test (100 Virtual Users / 1 Minute)
```bash
k6 run k6/baseline-test.js --summary-export=reports/raw-results.json
```

### Run Targeted Module Load Tests
```bash
k6 run k6/auth-test.js
k6 run k6/scan-test.js
k6 run k6/dashboard-test.js
```

---

## 4. Generating Reports

Run the automated report generator script to parse test results into markdown and formatted Excel reports:

```bash
node generate-report.js
```

Outputs will be saved in `performance-tests/reports/`:
- `performance-summary.md`
- `performance-summary.xlsx`
