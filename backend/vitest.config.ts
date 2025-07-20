// Create enhanced vitest config for better test running
// Create vitest.config.ts (if not exists)

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/app-test.ts',
        'src/tests/setup.ts'
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    // Enhanced test configuration
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true // Prevent database conflicts
      }
    },
    sequence: {
      concurrent: false // Run tests sequentially to avoid conflicts
    }
  },
});
