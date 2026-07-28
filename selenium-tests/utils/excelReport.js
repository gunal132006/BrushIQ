const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config/config');
const logger = require('./logger');

class ExcelReporter {
  static async generateSummaryWorkbook(testResults, executionMeta) {
    fs.ensureDirSync(config.paths.reports);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BrushIQ Selenium E2E Framework';
    workbook.created = new Date();

    // -------------------------------------------------------------
    // SHEET 1: Executive Summary
    // -------------------------------------------------------------
    const execSheet = workbook.addWorksheet('Executive Summary');
    execSheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 35 }
    ];

    const passRate = executionMeta.total > 0 
      ? ((executionMeta.passed / executionMeta.total) * 100).toFixed(2) + '%' 
      : '0%';

    execSheet.addRows([
      { metric: 'Project Name', value: 'BrushIQ Oral Healthcare Platform' },
      { metric: 'Test Suite Phase', value: 'Phase 1 - Selenium E2E Automation' },
      { metric: 'Execution Date', value: new Date().toLocaleString() },
      { metric: 'Target Browser', value: executionMeta.browser || 'Google Chrome' },
      { metric: 'Execution Duration', value: `${(executionMeta.durationSeconds || 0).toFixed(2)} seconds` },
      { metric: 'Total Test Cases', value: executionMeta.total },
      { metric: 'Passed Tests', value: executionMeta.passed },
      { metric: 'Failed Tests', value: executionMeta.failed },
      { metric: 'Skipped Tests', value: executionMeta.skipped || 0 },
      { metric: 'Pass Percentage', value: passRate }
    ]);

    // Style Executive Summary Sheet
    execSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
    execSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
    execSheet.eachRow((row, rowNumber) => {
      row.alignment = { vertical: 'middle' };
      if (rowNumber > 1) {
        row.getCell(1).font = { bold: true };
      }
    });

    // -------------------------------------------------------------
    // SHEET 2: Detailed Test Cases
    // -------------------------------------------------------------
    const detailSheet = workbook.addWorksheet('Detailed Test Cases');
    detailSheet.columns = [
      { header: 'Test ID', key: 'testId', width: 14 },
      { header: 'Module', key: 'module', width: 22 },
      { header: 'Test Name', key: 'testName', width: 32 },
      { header: 'Preconditions', key: 'preconditions', width: 30 },
      { header: 'Test Steps', key: 'steps', width: 45 },
      { header: 'Expected Result', key: 'expectedResult', width: 35 },
      { header: 'Actual Result', key: 'actualResult', width: 35 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Priority', key: 'priority', width: 14 },
      { header: 'Severity', key: 'severity', width: 14 }
    ];

    testResults.forEach(item => {
      const row = detailSheet.addRow({
        testId: item.testId,
        module: item.module,
        testName: item.testName,
        preconditions: item.preconditions || 'Application initialized',
        steps: Array.isArray(item.steps) ? item.steps.join(' | ') : item.steps,
        expectedResult: item.expectedResult,
        actualResult: item.actualResult || item.error || 'Verified successfully',
        status: item.status,
        priority: item.priority || 'P2 - Medium',
        severity: item.severity || 'Major'
      });

      const statusCell = row.getCell('status');
      if (item.status === 'PASSED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } }; // Soft Green
        statusCell.font = { color: { argb: '15803D' }, bold: true };
      } else if (item.status === 'FAILED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } }; // Soft Red
        statusCell.font = { color: { argb: 'B91C1C' }, bold: true };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF9C3' } }; // Soft Yellow
        statusCell.font = { color: { argb: 'A16207' }, bold: true };
      }
    });

    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };

    // -------------------------------------------------------------
    // SHEET 3: Failed Tests
    // -------------------------------------------------------------
    const failedSheet = workbook.addWorksheet('Failed Tests');
    failedSheet.columns = [
      { header: 'Test ID', key: 'testId', width: 15 },
      { header: 'Failure Reason / Error', key: 'failure', width: 50 },
      { header: 'Screenshot Path', key: 'screenshot', width: 40 },
      { header: 'Timestamp', key: 'timestamp', width: 25 }
    ];

    const failedItems = testResults.filter(t => t.status === 'FAILED');
    if (failedItems.length === 0) {
      failedSheet.addRow({
        testId: 'N/A',
        failure: 'No test failures encountered during execution.',
        screenshot: 'N/A',
        timestamp: new Date().toLocaleString()
      });
    } else {
      failedItems.forEach(f => {
        failedSheet.addRow({
          testId: f.testId,
          failure: f.error || f.actualResult || 'Assertion Error',
          screenshot: f.screenshotPath || 'N/A',
          timestamp: f.timestamp || new Date().toLocaleString()
        });
      });
    }

    failedSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    failedSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '991B1B' } };

    // -------------------------------------------------------------
    // SHEET 4: Execution Logs
    // -------------------------------------------------------------
    const logSheet = workbook.addWorksheet('Execution Logs');
    logSheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 25 },
      { header: 'Browser', key: 'browser', width: 20 },
      { header: 'Execution Time (s)', key: 'executionTime', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    testResults.forEach(item => {
      logSheet.addRow({
        timestamp: item.timestamp || new Date().toLocaleString(),
        browser: executionMeta.browser || 'Google Chrome',
        executionTime: `${((item.durationMs || 150) / 1000).toFixed(2)}s`,
        status: item.status
      });
    });

    logSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    logSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } };

    await workbook.xlsx.writeFile(config.paths.excelReport);
    logger.info(`Excel report successfully generated: ${config.paths.excelReport}`);
  }
}

module.exports = ExcelReporter;
