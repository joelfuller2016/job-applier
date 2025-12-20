import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Supports both production (real data) and test (mock data) modes
 * 
 * Run production tests: npx playwright test --project=production
 * Run test/mock tests: npx playwright test --project=test
 * Run all tests: npx playwright test
 */

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Production tests - uses real application state, no mocks
    {
      name: 'production',
      testMatch: /.*\.prod\.spec\.ts$/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: undefined, // No pre-authenticated state
      },
    },
    // Test/Mock mode - can use test fixtures and mock data
    {
      name: 'test',
      testMatch: /.*\.test\.spec\.ts$/,
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
    // Shared tests that run in both modes
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts$/,
      testIgnore: [/.*\.prod\.spec\.ts$/, /.*\.test\.spec\.ts$/],
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
