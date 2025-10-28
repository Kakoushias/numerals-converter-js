import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getRandomTestData, setThresholds, customMetrics, validateConversionResponse } from './config.js';

export const options = {
  ...setThresholds('stress'),
  scenarios: {
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },   // Start with 50 VUs
        { duration: '2m', target: 100 },  // Increase to 100 VUs
        { duration: '2m', target: 150 },  // Increase to 150 VUs
        { duration: '2m', target: 200 },  // Increase to 200 VUs
        { duration: '2m', target: 300 },  // Increase to 300 VUs
        { duration: '2m', target: 400 },  // Increase to 400 VUs
        { duration: '2m', target: 500 },  // Increase to 500 VUs
        { duration: '3m', target: 500 },  // Stay at 500 VUs
        { duration: '2m', target: 0 },    // Ramp down to 0 VUs
      ],
    },
  },
};

export default function () {
  const testData = getRandomTestData();
  
  // Test Arabic to Roman conversion
  const arabicResponse = http.get(`${BASE_URL}/roman/${testData.arabic}`);
  const arabicValid = validateConversionResponse(arabicResponse, 'roman');
  
  check(arabicResponse, {
    'Arabic to Roman - Status 200': (r) => r.status === 200,
    'Arabic to Roman - Valid Response': () => arabicValid,
    'Arabic to Roman - Correct Value': (r) => {
      if (!arabicValid) return false;
      const body = r.json();
      return body.convertedValue === testData.roman;
    },
    'Arabic to Roman - Response Time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (arabicValid) {
    customMetrics.conversionSuccess.add(1);
    customMetrics.arabicToRomanDuration.add(arabicResponse.timings.duration);
  } else {
    customMetrics.conversionErrors.add(1);
  }
  
  sleep(0.1);
  
  // Test Roman to Arabic conversion
  const romanResponse = http.get(`${BASE_URL}/arabic/${testData.roman}`);
  const romanValid = validateConversionResponse(romanResponse, 'arabic');
  
  check(romanResponse, {
    'Roman to Arabic - Status 200': (r) => r.status === 200,
    'Roman to Arabic - Valid Response': () => romanValid,
    'Roman to Arabic - Correct Value': (r) => {
      if (!romanValid) return false;
      const body = r.json();
      return body.convertedValue === testData.arabic;
    },
    'Roman to Arabic - Response Time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (romanValid) {
    customMetrics.conversionSuccess.add(1);
    customMetrics.romanToArabicDuration.add(romanResponse.timings.duration);
  } else {
    customMetrics.conversionErrors.add(1);
  }
  
  sleep(0.1);
  
  // Test health endpoint occasionally (5% of requests)
  if (Math.random() < 0.05) {
    const healthResponse = http.get(`${BASE_URL}/health`);
    check(healthResponse, {
      'Health Check - Status 200': (r) => r.status === 200,
      'Health Check - Valid Response': (r) => {
        const body = r.json();
        return body.status === 'healthy' && body.database && body.timestamp;
      },
    });
  }
  
  sleep(0.05);
}
