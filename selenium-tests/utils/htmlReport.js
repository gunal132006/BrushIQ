const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');
const logger = require('./logger');

class HtmlReporter {
  static generateReport(results, meta) {
    fs.ensureDirSync(path.dirname(config.paths.htmlReport));

    const passPercentage = meta.total > 0 ? ((meta.passed / meta.total) * 100).toFixed(1) : 0;
    const durationSec = (meta.durationSeconds || 0).toFixed(2);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BrushIQ Selenium E2E Test Execution Report</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body { background-color: #0b0f19; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
    .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .badge-pass { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-fail { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-skip { background: rgba(234, 179, 8, 0.15); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.3); }
  </style>
</head>
<body class="p-6 md:p-10 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-8">
    
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-500/20">B</div>
          <h1 class="text-3xl font-black tracking-tight text-white">BrushIQ Selenium E2E Report</h1>
        </div>
        <p class="text-slate-400 text-xs mt-1 font-semibold uppercase tracking-wider">Automated Browser Test Execution Results</p>
      </div>
      <div class="flex items-center gap-3 text-xs text-slate-400">
        <span>Execution Date: <strong>${new Date().toLocaleString()}</strong></span>
        <span>•</span>
        <span>Browser: <strong class="text-cyan-400">${meta.browser || 'Google Chrome'}</strong></span>
      </div>
    </div>

    <!-- METRIC CARDS -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass p-5 rounded-2xl">
        <span class="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Tests</span>
        <div class="text-3xl font-black mt-1 text-white">${meta.total}</div>
      </div>
      <div class="glass p-5 rounded-2xl border-emerald-500/30">
        <span class="text-emerald-400 text-xs font-bold uppercase tracking-wider">Passed</span>
        <div class="text-3xl font-black mt-1 text-emerald-400">${meta.passed}</div>
      </div>
      <div class="glass p-5 rounded-2xl border-rose-500/30">
        <span class="text-rose-400 text-xs font-bold uppercase tracking-wider">Failed</span>
        <div class="text-3xl font-black mt-1 text-rose-400">${meta.failed}</div>
      </div>
      <div class="glass p-5 rounded-2xl border-amber-500/30">
        <span class="text-amber-400 text-xs font-bold uppercase tracking-wider">Pass Rate</span>
        <div class="text-3xl font-black mt-1 text-amber-400">${passPercentage}%</div>
      </div>
      <div class="glass p-5 rounded-2xl">
        <span class="text-slate-400 text-xs font-bold uppercase tracking-wider">Duration</span>
        <div class="text-3xl font-black mt-1 text-cyan-400">${durationSec}s</div>
      </div>
    </div>

    <!-- FILTER & SEARCH -->
    <div class="glass p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
      <input type="text" id="searchInput" onkeyup="filterTable()" placeholder="Search test cases by ID, name or module..." class="w-full md:w-96 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500">
      <div class="flex gap-2 text-xs">
        <button onclick="filterStatus('ALL')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-slate-300">All</button>
        <button onclick="filterStatus('PASSED')" class="px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800 font-bold">Passed</button>
        <button onclick="filterStatus('FAILED')" class="px-3 py-1.5 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-800 font-bold">Failed</button>
      </div>
    </div>

    <!-- DETAILED TEST RESULTS TABLE -->
    <div class="glass rounded-2xl overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300" id="testTable">
          <thead class="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th class="p-4">Test ID</th>
              <th class="p-4">Module</th>
              <th class="p-4">Test Name</th>
              <th class="p-4">Steps</th>
              <th class="p-4">Expected Result</th>
              <th class="p-4 text-center">Status</th>
              <th class="p-4">Duration</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60" id="tableBody">
            ${results.map(r => `
            <tr class="hover:bg-slate-800/40 transition-colors status-row status-${r.status}">
              <td class="p-4 font-mono font-bold text-cyan-400">${r.testId}</td>
              <td class="p-4 font-semibold text-slate-400">${r.module}</td>
              <td class="p-4 font-bold text-white">${r.testName}</td>
              <td class="p-4 text-slate-400 max-w-xs truncate">${Array.isArray(r.steps) ? r.steps.join(' → ') : r.steps}</td>
              <td class="p-4 text-slate-400 max-w-xs truncate">${r.expectedResult}</td>
              <td class="p-4 text-center">
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${r.status === 'PASSED' ? 'badge-pass' : r.status === 'FAILED' ? 'badge-fail' : 'badge-skip'}">${r.status}</span>
              </td>
              <td class="p-4 font-mono text-slate-400">${((r.durationMs || 100) / 1000).toFixed(2)}s</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    function filterTable() {
      const input = document.getElementById('searchInput').value.toLowerCase();
      const rows = document.querySelectorAll('#tableBody tr');
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
      });
    }

    function filterStatus(status) {
      const rows = document.querySelectorAll('#tableBody tr');
      rows.forEach(row => {
        if (status === 'ALL') {
          row.style.display = '';
        } else {
          row.style.display = row.classList.contains('status-' + status) ? '' : 'none';
        }
      });
    }
  </script>
</body>
</html>`;

    fs.writeFileSync(config.paths.htmlReport, htmlContent);
    logger.info(`HTML report successfully generated at: ${config.paths.htmlReport}`);
  }
}

module.exports = HtmlReporter;
