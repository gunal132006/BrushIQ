import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, HEADERS } from './config.js';

export const options = {
  stages: [
    { duration: '10s', target: 25 },
    { duration: '30s', target: 50 },
    { duration: '10s', target: 0 },
  ],
};

export default function () {
  const rootRes = http.get(`${BASE_URL}/`);
  check(rootRes, { 'root API response OK': (r) => r.status === 200 });

  sleep(1);
}
