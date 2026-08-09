/**
 * BrushIQ API - 100 Virtual Users Baseline Load Test Engine
 * 
 * Target: 100 Concurrent Virtual Users (VUs)
 * Duration: 60 Seconds (1 Minute)
 * Authentication: Valid JWT Auth Token attached to requests
 * Output: Requests per second (RPS), Latency Distribution (Min, Avg, Max, P50, P90, P95, P99), SLA Status
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

let jwt;
try {
  jwt = require(path.join(__dirname, '../backend/node_modules/jsonwebtoken'));
} catch (e) {
  try {
    jwt = require('jsonwebtoken');
  } catch (err) {
    jwt = null;
  }
}

const app = require('../backend/src/app');

const PORT = 5002;
const CONCURRENCY = 100; // 100 Concurrent Virtual Users
const DURATION_MS = 60000; // 60 Seconds (1 Minute)
const JWT_SECRET = process.env.JWT_SECRET || 'brushiq_jwt_secret_key_2026';

// Generate valid JWT token for Virtual Users
const mockUser = { id: 1, email: 'gunal.s@brushiq.com', role: 'user' };
const AUTH_TOKEN = jwt ? jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' }) : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJndW5hbC5zQGJydXNoaXEuY29tIiwicm9sZSI6InVzZXIifQ.mock_token';

const ENDPOINTS = [
  { path: '/health', method: 'GET', name: 'Health Check' },
  { path: '/api/health', method: 'GET', name: 'API Health Status' },
  { path: '/api/system/database-status', method: 'GET', name: 'Database Status' },
  { path: '/', method: 'GET', name: 'Root Endpoint' },
  { path: '/api/tips', method: 'GET', name: 'Dental Tips' }
];

let server = null;
const responseTimes = [];
let totalRequests = 0;
let successRequests = 0;
let failedRequests = 0;
let bytesReceived = 0;
const statusCounts = {};

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`[LOAD TEST] Test Server active on http://127.0.0.1:${PORT}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[LOAD TEST] Test Server gracefully shut down.');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function sendRequest(endpoint) {
  return new Promise((resolve) => {
    const startTime = process.hrtime();
    
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'User-Agent': 'BrushIQ-LoadTester/1.0'
      },
      timeout: 3000
    }, (res) => {
      let bodyLength = 0;
      res.on('data', (chunk) => {
        bodyLength += chunk.length;
      });

      res.on('end', () => {
        const diff = process.hrtime(startTime);
        const latencyMs = (diff[0] * 1000) + (diff[1] / 1e6);
        
        totalRequests++;
        bytesReceived += bodyLength;
        statusCounts[res.statusCode] = (statusCounts[res.statusCode] || 0) + 1;

        if (res.statusCode >= 200 && res.statusCode < 400) {
          successRequests++;
          responseTimes.push(latencyMs);
        } else {
          failedRequests++;
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      totalRequests++;
      failedRequests++;
      statusCounts['500'] = (statusCounts['500'] || 0) + 1;
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      totalRequests++;
      failedRequests++;
      statusCounts['TIMEOUT'] = (statusCounts['TIMEOUT'] || 0) + 1;
      resolve();
    });

    req.end();
  });
}

async function runVirtualUser(workerId, stopTime) {
  let endpointIdx = workerId % ENDPOINTS.length;
  while (Date.now() < stopTime) {
    const endpoint = ENDPOINTS[endpointIdx % ENDPOINTS.length];
    endpointIdx++;
    await sendRequest(endpoint);
    await new Promise(r => setImmediate(r));
  }
}

async function executeBaselineLoadTest() {
  console.log('===============================================================');
  console.log('  BRUSHIQ API - BASELINE LOAD TEST EXECUTION (100 VUs)');
  console.log('===============================================================');
  console.log(`Concurrent Virtual Users (VUs): ${CONCURRENCY}`);
  console.log(`Target Test Duration         : ${DURATION_MS / 1000} seconds (1 minute)`);
  console.log(`Target Endpoint Pool        : ${ENDPOINTS.length} endpoints`);
  console.log(`Authentication Mode         : Bearer JWT Token Enabled`);
  console.log('---------------------------------------------------------------');

  await startServer();

  const startTime = Date.now();
  const stopTime = startTime + DURATION_MS;

  console.log(`[LOAD TEST] Launching ${CONCURRENCY} Virtual Users...`);

  const vus = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    vus.push(runVirtualUser(i, stopTime));
  }

  const ticker = setInterval(() => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
    const currentRPS = (totalRequests / (elapsedSec || 1)).toFixed(1);
    console.log(`[PROGRESS ${elapsedSec}s/60s] Total Requests: ${totalRequests} | Current RPS: ${currentRPS} req/sec | Success: ${successRequests}`);
  }, 10000);

  await Promise.all(vus);
  clearInterval(ticker);

  const actualDurationSec = (Date.now() - startTime) / 1000;
  await stopServer();

  responseTimes.sort((a, b) => a - b);
  
  const minLatency = responseTimes.length ? responseTimes[0] : 0;
  const maxLatency = responseTimes.length ? responseTimes[responseTimes.length - 1] : 0;
  const sumLatency = responseTimes.reduce((a, b) => a + b, 0);
  const avgLatency = responseTimes.length ? sumLatency / responseTimes.length : 0;

  function percentile(arr, p) {
    if (!arr.length) return 0;
    const idx = Math.floor((p / 100) * arr.length);
    return arr[Math.min(idx, arr.length - 1)];
  }

  const p50 = percentile(responseTimes, 50);
  const p90 = percentile(responseTimes, 90);
  const p95 = percentile(responseTimes, 95);
  const p99 = percentile(responseTimes, 99);

  const rps = (totalRequests / actualDurationSec).toFixed(2);
  const successRate = totalRequests ? ((successRequests / totalRequests) * 100).toFixed(2) : 0;
  const errorRate = totalRequests ? ((failedRequests / totalRequests) * 100).toFixed(2) : 0;
  const throughputKB = ((bytesReceived / 1024) / actualDurationSec).toFixed(2);

  const passAvgSLA = avgLatency <= 300;
  const passMaxSLA = maxLatency <= 2000;
  const passErrorSLA = parseFloat(errorRate) <= 0.1;
  const overallSLA = passAvgSLA && passMaxSLA && passErrorSLA;

  console.log('\n===============================================================');
  console.log('  LOAD TEST EXECUTION RESULTS SUMMARY');
  console.log('===============================================================');
  console.log(`Total Requests Sent    : ${totalRequests.toLocaleString()}`);
  console.log(`Successful Requests    : ${successRequests.toLocaleString()} (${successRate}%)`);
  console.log(`Failed / Error Requests: ${failedRequests} (${errorRate}%)`);
  console.log(`Test Execution Duration: ${actualDurationSec.toFixed(2)} seconds`);
  console.log(`Throughput Rate        : ${throughputKB} KB/sec`);
  console.log('---------------------------------------------------------------');
  console.log(`⚡ REQUESTS PER SECOND (RPS): ${rps} req/sec`);
  console.log('---------------------------------------------------------------');
  console.log('⏱️  RESPONSE TIME DISTRIBUTION:');
  console.log(`   - Minimum (Fastest) : ${minLatency.toFixed(2)} ms`);
  console.log(`   - Average Response  : ${avgLatency.toFixed(2)} ms`);
  console.log(`   - Median (P50)      : ${p50.toFixed(2)} ms`);
  console.log(`   - 90th Percentile P90: ${p90.toFixed(2)} ms`);
  console.log(`   - 95th Percentile P95: ${p95.toFixed(2)} ms`);
  console.log(`   - 99th Percentile P99: ${p99.toFixed(2)} ms`);
  console.log(`   - Maximum (Slowest) : ${maxLatency.toFixed(2)} ms`);
  console.log('---------------------------------------------------------------');
  console.log(`SLA EVALUATION STATUS  : ${overallSLA ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Avg Response SLA (<300ms) : ${passAvgSLA ? 'PASSED' : 'FAILED'}`);
  console.log(`   - Max Response SLA (<2000ms): ${passMaxSLA ? 'PASSED' : 'FAILED'}`);
  console.log(`   - Error Rate SLA (<0.1%)    : ${passErrorSLA ? 'PASSED' : 'FAILED'}`);
  console.log('===============================================================\n');

  const resultsPayload = {
    testName: "100 Virtual Users Baseline Load Test",
    timestamp: new Date().toISOString(),
    config: {
      virtualUsers: CONCURRENCY,
      durationSeconds: Math.round(actualDurationSec),
      endpoints: ENDPOINTS.map(e => e.path)
    },
    metrics: {
      totalRequests,
      successRequests,
      failedRequests,
      requestsPerSecond: parseFloat(rps),
      throughputKBps: parseFloat(throughputKB),
      successRatePercent: parseFloat(successRate),
      errorRatePercent: parseFloat(errorRate),
      latency: {
        minMs: Math.round(minLatency * 100) / 100,
        avgMs: Math.round(avgLatency * 100) / 100,
        maxMs: Math.round(maxLatency * 100) / 100,
        p50Ms: Math.round(p50 * 100) / 100,
        p90Ms: Math.round(p90 * 100) / 100,
        p95Ms: Math.round(p95 * 100) / 100,
        p99Ms: Math.round(p99 * 100) / 100
      }
    },
    statusCounts,
    slaStatus: overallSLA ? "PASSED" : "FAILED"
  };

  const resultsPath = path.join(__dirname, 'load-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(resultsPayload, null, 2));
  console.log(`[LOAD TEST] Results exported to: ${resultsPath}`);
}

if (require.main === module) {
  executeBaselineLoadTest();
}

module.exports = executeBaselineLoadTest;
