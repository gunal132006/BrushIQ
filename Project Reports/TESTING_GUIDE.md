# BrushIQ — Comprehensive Testing Strategy & Execution Guide

This document outlines the testing strategy, frameworks, execution instructions, and coverage metrics across unit, integration, web automation, mobile automation, and performance testing for BrushIQ.

---

## 1. Multi-Layer Testing Architecture

```
                    ┌────────────────────────────────┐
                    │    End-to-End Automation       │
                    │   (Selenium Web & Appium)      │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │   Performance Load Testing     │
                    │         (k6 Engine)            │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │  Backend Unit & API Tests      │
                    │        (Jest & Supertest)      │
                    └────────────────────────────────┘
```

---

## 2. Backend Unit & API Testing (Jest & Supertest)

- **Framework**: Jest v29 & Supertest v6
- **Location**: `backend/tests/`
- **Key Test Files**:
  - `auth.test.js`: Google Sign-In, token signing, registration, error states.
  - `ai.test.js`: AI Computer Vision wear analysis engine scoring verification.
- **Execution Command**:
  ```bash
  cd backend && npm test
  ```

---

## 3. Web End-to-End Automation (Selenium WebDriver)

- **Framework**: Selenium WebDriver for Node.js
- **Location**: `selenium-tests/`
- **Execution Command**:
  ```bash
  cd selenium-tests && npm test
  ```
- **Generated Reports**:
  - `selenium-summary.xlsx`
  - `selenium-test-cases.xlsx`

---

## 4. Mobile End-to-End Automation (Appium)

- **Framework**: Appium v2 + UIAutomator2
- **Location**: `appium-tests/`
- **Execution Command**:
  ```bash
  cd appium-tests && npm test
  ```
- **Generated Reports**:
  - `appium-summary.xlsx`
  - `appium-test-cases.xlsx`

---

## 5. Load & Baseline Performance Testing (k6)

- **Framework**: k6 Load Testing Engine
- **Location**: `performance-tests/`
- **Load Profile**: 100 Virtual Users (VUs) for 60 seconds.
- **Execution Command**:
  ```bash
  cd performance-tests && npm run test:baseline
  node generate-report.js
  ```
- **Generated Reports**:
  - `performance-summary.md`
  - `performance-summary.xlsx`
