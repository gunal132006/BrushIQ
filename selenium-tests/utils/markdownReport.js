const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');
const logger = require('./logger');

class MarkdownReporter {
  static generateReport(results, meta) {
    fs.ensureDirSync(path.dirname(config.paths.markdownSummary));

    const passPercentage = meta.total > 0 ? ((meta.passed / meta.total) * 100).toFixed(2) : 0;
    const durationSec = (meta.durationSeconds || 0).toFixed(2);

    const mdContent = `# BrushIQ Selenium E2E Test Execution Summary

## Executive Overview

- **Execution Date**: ${new Date().toLocaleString()}
- **Target Browser**: ${meta.browser || 'Google Chrome'}
- **Total Duration**: ${durationSec} seconds
- **Pass Rate**: ${passPercentage}%

| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Total Test Cases** | **${meta.total}** | 100.0% |
| **Passed** | <font color="green">**${meta.passed}**</font> | ${passPercentage}% |
| **Failed** | <font color="red">**${meta.failed}**</font> | ${(100 - passPercentage).toFixed(2)}% |
| **Skipped** | **${meta.skipped || 0}** | 0.0% |

---

## Module Breakdown

| Module | Total Cases | Passed | Failed | Pass Rate |
| :--- | :--- | :--- | :--- | :--- |
${meta.moduleBreakdown.map(m => `| ${m.name} | ${m.total} | ${m.passed} | ${m.failed} | ${m.passRate}% |`).join('\n')}

---

## Technical Recommendations

> [!TIP]
> - Ensure frontend dev server is running on \`http://localhost:5173\` during test runs.
> - Maintain stable CSS selectors and \`data-testid\` attributes across updates.
> - Detailed Excel reports and HTML dashboards are saved under \`selenium-tests/reports/\`.

`;

    fs.writeFileSync(config.paths.markdownSummary, mdContent);
    logger.info(`Markdown execution summary generated at: ${config.paths.markdownSummary}`);
  }
}

module.exports = MarkdownReporter;
