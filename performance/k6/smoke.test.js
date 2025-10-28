import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getRandomTestData, setThresholds, customMetrics, validateConversionResponse } from './config.js';

export const options = setThresholds('smoke');

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
    }
  });
  
  if (arabicValid) {
    customMetrics.conversionSuccess.add(1);
    customMetrics.arabicToRomanDuration.add(arabicResponse.timings.duration);
  } else {
    customMetrics.conversionErrors.add(1);
  }
  
  sleep(1);
  
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
    }
  });
  
  if (romanValid) {
    customMetrics.conversionSuccess.add(1);
    customMetrics.romanToArabicDuration.add(romanResponse.timings.duration);
  } else {
    customMetrics.conversionErrors.add(1);
  }
  
  sleep(1);
  
  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'Health Check - Status 200': (r) => r.status === 200,
    'Health Check - Valid Response': (r) => {
      const body = r.json();
      return body.status === 'healthy' && body.database && body.timestamp;
    }
  });
  
  sleep(1);
}
