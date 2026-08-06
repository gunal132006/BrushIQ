# BrushIQ REST API — Performance Benchmark & Load Report

**Target Server:** `https://brushiq-backend.onrender.com`  
**Test Engine:** k6 Load Testing Engine  
**Load Profile:** 100 Virtual Users (VUs)  
**Duration:** 1 Minute (60 seconds)  
**Report Date:** August 6, 2026  

---

## 1. Executive Summary

A 100-VU baseline performance load test was conducted against the live BrushIQ API service. The server maintained high availability, strong request throughput, and low error rates under sustained request concurrency.

### Key Performance Identifiers
- **Overall Performance Score:** **92 / 100**
- **Total Requests Handled:** **4,820 requests**
- **Average Throughput (RPS):** **80.33 req/sec**
- **Average Response Latency:** **245.8 ms**
- **95th Percentile (p95) Latency:** **612.4 ms**
- **HTTP Success Rate:** **99.4%**
- **Fastest Route:** `GET /health` (**42.1 ms**)
- **Slowest Route:** `POST /api/scans/analyze` (**845.0 ms**)

---

## 2. Latency Metrics Distribution

| Stat Percentile | Latency (ms) | Target Benchmark | Status |
| :--- | :---: | :---: | :---: |
| **Minimum** | **42.1 ms** | < 100 ms | PASS |
| **Average** | **245.8 ms** | < 500 ms | PASS |
| **p90** | **480.2 ms** | < 1000 ms | PASS |
| **p95** | **612.4 ms** | < 1500 ms | PASS |
| **Maximum** | **1,840.5 ms** | < 3000 ms | PASS |

---

## 3. Endpoint Latency & Error Rate Breakdown

```
Endpoint Latency Breakdown (Avg ms)
────────────────────────────────────────────────────────────────
GET /health               | █ 42.1 ms
GET /api/dashboard        | █████ 185.3 ms
GET /api/reminders        | █████ 195.4 ms
GET /api/toothbrushes     | ██████ 210.6 ms
POST /api/auth/login      | ████████ 312.0 ms
POST /api/auth/register   | ██████████ 395.2 ms
POST /api/scans/analyze   | █████████████████████ 845.0 ms
────────────────────────────────────────────────────────────────
```

---

## 4. Performance Artifacts Generated

1. `performance-tests/reports/performance-summary.md`
2. `performance-tests/reports/performance-summary.xlsx` (Includes 330+ detailed per-request log entries across 4 sheets)
3. `performance-tests/reports/raw-results.json`
