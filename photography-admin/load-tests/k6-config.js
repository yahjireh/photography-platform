/**
 * k6 Load Testing Configuration for PhotoBook Admin Dashboard
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 * Run: k6 run load-tests/k6-config.js
 * Run with dashboard: k6 run --out web-dashboard load-tests/k6-config.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const dashboardDuration = new Trend('dashboard_load_duration');
const apiResponseTime = new Trend('api_response_time');
const pageLoadCounter = new Counter('page_loads');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:3000/api';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@photobook.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'AdminPass123!';

// Test scenarios
export const options = {
  scenarios: {
    // Scenario 1: Smoke test (basic sanity)
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '0s',
      tags: { scenario: 'smoke' },
    },

    // Scenario 2: Average load (normal traffic)
    average_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },  // Ramp up to 10 users
        { duration: '3m', target: 10 },  // Stay at 10 for 3 minutes
        { duration: '1m', target: 0 },   // Ramp down
      ],
      startTime: '30s',
      tags: { scenario: 'average' },
    },

    // Scenario 3: Stress test (high traffic)
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 30 },  // Ramp up to 30 users
        { duration: '5m', target: 30 },  // Stay at 30
        { duration: '2m', target: 50 },  // Push to 50
        { duration: '3m', target: 50 },  // Stay at 50
        { duration: '2m', target: 0 },   // Ramp down
      ],
      startTime: '5m30s',
      tags: { scenario: 'stress' },
    },

    // Scenario 4: Spike test (sudden traffic burst)
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 }, // Sudden spike to 100
        { duration: '1m', target: 100 },  // Stay at 100
        { duration: '10s', target: 0 },   // Drop to 0
      ],
      startTime: '20m',
      tags: { scenario: 'spike' },
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<2000'],   // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],       // Less than 5% failures
    errors: ['rate<0.1'],                 // Less than 10% custom errors
    login_duration: ['p(95)<3000'],       // Login under 3s
    dashboard_load_duration: ['p(95)<5000'], // Dashboard under 5s
  },
};

// Setup: Authenticate once and return token
export function setup() {
  const loginRes = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const body = JSON.parse(loginRes.body || '{}');
  return { token: body.data?.token || '' };
}

// Main test function
export default function (data) {
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`,
    },
  };

  // Login flow
  group('Authentication', () => {
    const start = Date.now();
    const res = http.post(`${API_URL}/auth/login`, JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }), { headers: { 'Content-Type': 'application/json' } });

    loginDuration.add(Date.now() - start);
    check(res, {
      'login status is 200': (r) => r.status === 200,
      'login returns token': (r) => JSON.parse(r.body || '{}').data?.token !== undefined,
    }) || errorRate.add(1);
  });

  sleep(1);

  // Dashboard stats
  group('Dashboard', () => {
    const start = Date.now();
    const res = http.get(`${API_URL}/admin/dashboard/stats`, authHeaders);
    dashboardDuration.add(Date.now() - start);
    pageLoadCounter.add(1);

    check(res, {
      'dashboard stats 200': (r) => r.status === 200,
      'dashboard has data': (r) => JSON.parse(r.body || '{}').success === true,
    }) || errorRate.add(1);

    apiResponseTime.add(res.timings.duration);
  });

  sleep(0.5);

  // Users listing
  group('Users API', () => {
    const res = http.get(`${API_URL}/admin/users?page=1&limit=20`, authHeaders);
    check(res, {
      'users list 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    apiResponseTime.add(res.timings.duration);
  });

  sleep(0.5);

  // Bookings listing
  group('Bookings API', () => {
    const res = http.get(`${API_URL}/admin/bookings?page=1&limit=20`, authHeaders);
    check(res, {
      'bookings list 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    apiResponseTime.add(res.timings.duration);
  });

  sleep(0.5);

  // Photographers listing
  group('Photographers API', () => {
    const res = http.get(`${API_URL}/admin/photographers?page=1&limit=20`, authHeaders);
    check(res, {
      'photographers list 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    apiResponseTime.add(res.timings.duration);
  });

  sleep(0.5);

  // Payments listing
  group('Payments API', () => {
    const res = http.get(`${API_URL}/admin/payments?page=1&limit=20`, authHeaders);
    check(res, {
      'payments list 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    apiResponseTime.add(res.timings.duration);
  });

  sleep(0.5);

  // Analytics
  group('Analytics API', () => {
    const res = http.get(`${API_URL}/admin/analytics/overview`, authHeaders);
    check(res, {
      'analytics 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    apiResponseTime.add(res.timings.duration);
  });

  sleep(0.5);

  // Settings
  group('Settings API', () => {
    const res = http.get(`${API_URL}/admin/settings`, authHeaders);
    check(res, {
      'settings 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    apiResponseTime.add(res.timings.duration);
  });

  sleep(1);
}

// Teardown
export function teardown(data) {
  // Optional: logout or cleanup
  console.log('Load test completed');
}
