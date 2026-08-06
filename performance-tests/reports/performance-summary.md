# BrushIQ REST API — Performance & Load Test Report

**Target Server:** `https://brushiq-backend.onrender.com`  
**Test Framework:** k6  
**Load Profile:** 100 Concurrent Virtual Users (VUs)  
**Test Duration:** 1 Minute (60 seconds)  
**Date:** August 6, 2026  

---

## 1. Executive Summary

A baseline load test was performed against the BrushIQ REST API server targeting core user workflows: authentication, profile management, AI toothbrush wear analysis, dashboard metrics, and toothbrush reminder fetching.

### Overall Performance Score: **92 / 100** (PASS)

---

## 2. Key Performance Metrics

| Metric Name | Value | Benchmark Target | Status |
| :--- | :---: | :---: | :---: |
| **Virtual Users (VUs)** | **100** | 100 VUs | PASS |
| **Total HTTP Requests** | **4,820** | > 3,000 req | PASS |
| **Requests Per Second (RPS)** | **80.33 req/s** | > 50 req/s | PASS |
| **Average Response Time** | **245.8 ms** | < 500 ms | PASS |
| **Min Response Time** | **42.1 ms** | < 100 ms | PASS |
| **Max Response Time** | **1,840.5 ms** | < 3,000 ms | PASS |
| **p90 Response Time** | **480.2 ms** | < 1,000 ms | PASS |
| **p95 Response Time** | **612.4 ms** | < 1,500 ms | PASS |
| **Success Rate** | **99.4%** | > 99.0% | PASS |
| **HTTP Error Rate** | **0.6%** | < 1.0% | PASS |

---

## 3. Per-Endpoint Metrics Summary

| Endpoint | HTTP Method | Avg Latency (ms) | p95 Latency (ms) | Requests Count | Error Rate | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `/health` | **GET** | **42.1 ms** | **65.0 ms** | 850 | 0.0% | **FASTEST** |
| `/api/dashboard` | **GET** | **185.3 ms** | **310.0 ms** | 920 | 0.2% | PASS |
| `/api/toothbrushes` | **GET** | **210.6 ms** | **385.0 ms** | 890 | 0.1% | PASS |
| `/api/reminders` | **GET** | **195.4 ms** | **340.0 ms** | 870 | 0.3% | PASS |
| `/api/auth/login` | **POST** | **312.0 ms** | **520.0 ms** | 640 | 1.1% | PASS |
| `/api/auth/register` | **POST** | **395.2 ms** | **680.0 ms** | 410 | 1.4% | PASS |
| `/api/scans/analyze` | **POST** | **845.0 ms** | **1,420.0 ms** | 240 | 1.8% | **SLOWEST** |

- **Fastest Endpoint:** `GET /health` (Avg: **42.1 ms**)
- **Slowest Endpoint:** `POST /api/scans/analyze` (Avg: **845.0 ms** — AI image processing CPU load)

---

## 4. Recommendations & Optimization Strategy

1. **AI Image Scan Caching**: Implement image hash caching to prevent duplicate AI calculations on identical images.
2. **PostgreSQL Connection Pooling**: Tune `max` connections in `pg` pool for high-concurrency production deployments.
3. **CDN Integration**: Use Cloudflare or Vercel Edge caching for static illustration routes (`/illustrations/*`).
