import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/__tests__/**',
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@job-applier/core': './packages/core/src',
      '@job-applier/database': './packages/database/src',
      '@job-applier/config': './packages/config/src',
      '@job-applier/resume-parser': './packages/resume-parser/src',
      '@job-applier/job-discovery': './packages/job-discovery/src',
      '@job-applier/browser-automation': './packages/browser-automation/src',
      '@job-applier/platforms': './packages/platforms/src',
      '@job-applier/application-tracker': './packages/application-tracker/src',
      '@job-applier/orchestrator': './packages/orchestrator/src',
    },
  },
});
