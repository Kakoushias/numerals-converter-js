import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getRandomTestData, setThresholds, customMetrics, validateConversionResponse } from './config.js';

export const options = {
  ...setThresholds('load'),
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },  // Ramp up to 50 VUs
        { duration: '3m', target: 100 }, // Ramp up to 100 VUs
        { duration: '10m', target: 100 }, // Stay at 100 VUs
        { duration: '2m', target: 0 },   // Ramp down to 0 VUs
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
    'Arabic to Roman - Response Time < 300ms': (r) => r.timings.duration < 300,
  });
  
  if (arabicValid) {
    customMetrics.conversionSuccess.add(1);
    customMetrics.arabicToRomanDuration.add(arabicResponse.timings.duration);
  } else {
    customMetrics.conversionErrors.add(1);
  }
  
  sleep(0.5);
  
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
    'Roman to Arabic - Response Time < 300ms': (r) => r.timings.duration < 300,
  });
  
  if (romanValid) {
    customMetrics.conversionSuccess.add(1);
    customMetrics.romanToArabicDuration.add(romanResponse.timings.duration);
  } else {
    customMetrics.conversionErrors.add(1);
  }
  
  sleep(0.5);
  
  // Occasionally test the /all endpoint (10% of requests)
  if (Math.random() < 0.1) {
    const allResponse = http.get(`${BASE_URL}/all?limit=10`);
    check(allResponse, {
      'Get All - Status 200': (r) => r.status === 200,
      'Get All - Valid Response': (r) => {
        const body = r.json();
        return body.data && Array.isArray(body.data) && typeof body.total === 'number';
      },
    });
  }
  
  sleep(0.1);
}
