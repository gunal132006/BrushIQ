import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, HEADERS } from './config.js';

export const options = {
  stages: [
    { duration: '10s', target: 15 },
    { duration: '30s', target: 30 },
    { duration: '10s', target: 0 },
  ],
};

export default function () {
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, { 'health check OK': (r) => r.status === 200 });

  sleep(1);
}
