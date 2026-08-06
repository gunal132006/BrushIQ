import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, BASELINE_OPTIONS, HEADERS } from './config.js';

export const options = BASELINE_OPTIONS;

export default function () {
  const userRandom = Math.floor(Math.random() * 1000000);
  const email = `k6user${userRandom}@example.com`;
  const password = 'SecurePassword123!';

  // 1. POST /api/auth/register
  const regPayload = JSON.stringify({
    fullName: `k6 Load User ${userRandom}`,
    email: email,
    password: password,
  });

  const regRes = http.post(`${BASE_URL}/api/auth/register`, regPayload, { headers: HEADERS });
  check(regRes, {
    'register status is 201 or 400': (r) => r.status === 201 || r.status === 400,
  });

  // 2. POST /api/auth/login
  const loginPayload = JSON.stringify({
    email: email,
    password: password,
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, { headers: HEADERS });
  const loginSuccess = check(loginRes, {
    'login status is 200 or 400': (r) => r.status === 200 || r.status === 400,
  });

  let token = '';
  if (loginRes.status === 200 && loginRes.json() && loginRes.json().token) {
    token = loginRes.json().token;
  }

  const authHeaders = {
    ...HEADERS,
    'Authorization': `Bearer ${token}`,
  };

  // 3. GET /api/dashboard
  if (token) {
    const dashRes = http.get(`${BASE_URL}/api/dashboard`, { headers: authHeaders });
    check(dashRes, {
      'dashboard status is 200': (r) => r.status === 200,
    });

    // 4. GET /api/toothbrushes
    const brushRes = http.get(`${BASE_URL}/api/toothbrushes`, { headers: authHeaders });
    check(brushRes, {
      'toothbrushes status is 200': (r) => r.status === 200,
    });

    // 5. GET /api/reminders
    const remRes = http.get(`${BASE_URL}/api/reminders`, { headers: authHeaders });
    check(remRes, {
      'reminders status is 200': (r) => r.status === 200,
    });
  } else {
    // Public health check endpoint fallback if token is not set
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      'health status is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
