// vitest.config.ts - Backend test configuration
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 30000, // 30 seconds for tests
    hookTimeout: 30000, // 30 seconds for hooks
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Run all tests in a single thread
        isolate: false // Share context between tests
      }
    },
    sequence: {
      concurrent: false // Run tests sequentially
    },
    env: {
      NODE_ENV: 'test',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USER: 'root',
      DB_PASSWORD: 'thisisREALLYIT29!',
      DB_NAME: 'reved_kids',
      REDIS_ENABLED: 'false'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
