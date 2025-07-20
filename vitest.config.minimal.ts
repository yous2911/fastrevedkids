import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Bare minimum configuration
    environment: 'node',

    // Very short timeouts to fail fast
    testTimeout: 3000,
    hookTimeout: 1000,

    // No setup files, no coverage, no external dependencies
    // setupFiles: [], // Commented out to avoid any setup issues

    // Run only the most basic test
    include: ['src/tests/minimal.test.ts'],

    // Disable everything that could cause issues
    watch: false,
    coverage: {
      enabled: false,
    },

    // Force single-threaded execution
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    // Minimal reporter
    reporter: 'basic',

    // No retries
    retry: 0,
  },
});
