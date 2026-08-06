// k6 Performance Testing Base Configuration

export const BASE_URL = __ENV.TARGET_URL || 'https://brushiq-backend.onrender.com';

export const BASELINE_OPTIONS = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 VUs
    { duration: '40s', target: 100 }, // Sustain 100 VUs
    { duration: '10s', target: 0 },   // Ramp down to 0 VUs
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2000ms
  },
};

export const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
