import http from 'k6/http';
import { sleep, check } from 'k6';

// k6 smoke test for market prices endpoint
// Run: k6 run scripts/perf/market-prices.k6.js
// Env: BASE_URL=http://localhost:3000

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.01'],
  },
};

const base = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(
    `${base}/api/market/prices?itemIds=T4_BAG&locations=Caerleon&qualities=1`
  );
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has items array': (r) => {
      try {
        const json = r.json();
        return Array.isArray(json.items);
      } catch (e) {
        return false;
      }
    },
  });
  sleep(1);
}