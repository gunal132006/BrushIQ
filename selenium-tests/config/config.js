const environment = require('./environment');
const browser = require('./browser');
const path = require('path');

module.exports = {
  env: environment,
  browser: browser,
  paths: {
    root: path.resolve(__dirname, '..'),
    reports: path.resolve(__dirname, '../reports'),
    screenshots: path.resolve(__dirname, '../reports/screenshots'),
    logs: path.resolve(__dirname, '../reports/logs'),
    htmlReport: path.resolve(__dirname, '../reports/html/index.html'),
    excelReport: path.resolve(__dirname, '../reports/selenium-summary.xlsx'),
    testCasesExcel: path.resolve(__dirname, '../test-cases/selenium-test-cases.xlsx'),
    markdownSummary: path.resolve(__dirname, '../reports/execution-summary.md')
  }
};
