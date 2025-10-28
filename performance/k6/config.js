// Shared configuration for k6 performance tests
import { Counter, Trend } from 'k6/metrics';

// Base configuration
export const BASE_URL = __ENV.API_URL || 'http://backend-dev:3001';

// Test data - Roman/Arabic pairs for testing
export const TEST_DATA = [
  { arabic: 1, roman: 'I' },
  { arabic: 4, roman: 'IV' },
  { arabic: 9, roman: 'IX' },
  { arabic: 40, roman: 'XL' },
  { arabic: 90, roman: 'XC' },
  { arabic: 400, roman: 'CD' },
  { arabic: 900, roman: 'CM' },
  { arabic: 2023, roman: 'MMXXIII' },
  { arabic: 3999, roman: 'MMMCMXCIX' },
  { arabic: 1234, roman: 'MCCXXXIV' },
  { arabic: 567, roman: 'DLXVII' },
  { arabic: 89, roman: 'LXXXIX' }
];

// Random test data generator
export function getRandomTestData() {
  return TEST_DATA[Math.floor(Math.random() * TEST_DATA.length)];
}

// Thresholds for different test types
export const THRESHOLDS = {
  smoke: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'], // 95% success rate
  },
  load: {
    http_req_duration: ['p(95)<300', 'p(99)<500'],
    http_req_failed: ['rate<0.10'], // 90% success rate (realistic for sustained load at 100 VUs)
  },
  stress: {
    http_req_duration: ['p(95)<1000'], // More lenient for stress testing
    http_req_failed: ['rate<0.1'], // Allow up to 10% failure rate
  }
};

// Common options for all tests
export const COMMON_OPTIONS = {
  thresholds: {},
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  summaryTimeUnit: 'ms',
};

// Helper function to set thresholds based on test type
export function setThresholds(testType) {
  return {
    ...COMMON_OPTIONS,
    thresholds: THRESHOLDS[testType] || {}
  };
}

// Custom metrics
export const customMetrics = {
  conversionSuccess: new Counter('conversion_success'),
  conversionErrors: new Counter('conversion_errors'),
  arabicToRomanDuration: new Trend('arabic_to_roman_duration'),
  romanToArabicDuration: new Trend('roman_to_arabic_duration'),
};

// Helper function to validate conversion response
export function validateConversionResponse(response, expectedType) {
  if (response.status !== 200) {
    return false;
  }
  
  try {
    const body = response.json();
    
    if (!body.inputValue || !body.convertedValue) {
      return false;
    }
    
    if (expectedType === 'arabic' && typeof body.convertedValue !== 'number') {
      return false;
    }
    
    if (expectedType === 'roman' && typeof body.convertedValue !== 'string') {
      return false;
    }
    
    return true;
  } catch (e) {
    // Failed to parse JSON
    return false;
  }
}
