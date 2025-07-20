import { config } from './environment';

export const testConfig = {
  ...config,
  NODE_ENV: 'test' as const,
  DB_HOST: process.env.TEST_DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.TEST_DB_PORT || '3307'), // Different port for test DB
  DB_NAME: process.env.TEST_DB_NAME || 'reved_kids_test',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD || '',
  // Disable Redis in tests
  REDIS_ENABLED: false,
  // Faster timeouts for tests
  REQUEST_TIMEOUT: 5000,
  RATE_LIMIT_MAX: 1000, // Higher limits for tests
};
