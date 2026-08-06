import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, HEADERS } from './config.js';

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const userNum = Math.floor(Math.random() * 500000);
  const email = `authperf${userNum}@example.com`;
  const password = 'AuthPassword123!';

  // Register
  const regRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    fullName: `Auth Perf User ${userNum}`,
    email: email,
    password: password
  }), { headers: HEADERS });

  check(regRes, { 'register success or duplicate': (r) => r.status === 201 || r.status === 400 });

  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: email,
    password: password
  }), { headers: HEADERS });

  check(loginRes, { 'login success or rate limited': (r) => r.status === 200 || r.status === 429 });

  sleep(1);
}
