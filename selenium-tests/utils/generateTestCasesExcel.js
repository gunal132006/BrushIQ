const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config/config');
const { testCases } = require('./testCaseRegistry');
const logger = require('./logger');

async function generateTestCasesMasterExcel() {
  fs.ensureDirSync(path.dirname(config.paths.testCasesExcel));
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BrushIQ Selenium E2E Framework';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Selenium Test Cases');
  sheet.columns = [
    { header: 'Test ID', key: 'testId', width: 15 },
    { header: 'Module', key: 'module', width: 25 },
    { header: 'Test Name', key: 'testName', width: 35 },
    { header: 'Preconditions', key: 'preconditions', width: 30 },
    { header: 'Test Steps', key: 'steps', width: 45 },
    { header: 'Expected Result', key: 'expectedResult', width: 35 },
    { header: 'Priority', key: 'priority', width: 15 },
    { header: 'Severity', key: 'severity', width: 15 }
  ];

  testCases.forEach(tc => {
    sheet.addRow({
      testId: tc.testId,
      module: tc.module,
      testName: tc.testName,
      preconditions: tc.preconditions,
      steps: Array.isArray(tc.steps) ? tc.steps.join(' | ') : tc.steps,
      expectedResult: tc.expectedResult,
      priority: tc.priority,
      severity: tc.severity
    });
  });

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };

  await workbook.xlsx.writeFile(config.paths.testCasesExcel);
  logger.info(`Master test cases Excel generated successfully at: ${config.paths.testCasesExcel}`);
}

if (require.main === module) {
  generateTestCasesMasterExcel();
}

module.exports = generateTestCasesMasterExcel;
