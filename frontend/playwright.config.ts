import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Tests the data privacy educational game flows end-to-end.
 * Organized into test projects by priority and type.
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Test timeout (varies by project)
  timeout: 30 * 1000,

  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry configuration (varies by project)
  retries: process.env.CI ? 2 : 0,

  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results.json' }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure test projects by category
  projects: [
    // Critical path tests - must pass, no retries
    {
      name: 'critical',
      testDir: './tests/e2e/critical-path',
      use: { ...devices['Desktop Chrome'] },
      retries: 0, // No retries - must pass on first try
    },

    // Feature tests - comprehensive coverage, allow 1 retry
    {
      name: 'features',
      testDir: './tests/e2e/features',
      use: { ...devices['Desktop Chrome'] },
      retries: process.env.CI ? 1 : 0,
    },

    // Integration tests - allow 2 retries for stability
    {
      name: 'integration',
      testDir: './tests/e2e/integration',
      use: { ...devices['Desktop Chrome'] },
      retries: process.env.CI ? 2 : 0,
    },

    // Performance tests - longer timeout, allow 1 retry
    {
      name: 'performance',
      testDir: './tests/e2e/performance',
      use: { ...devices['Desktop Chrome'] },
      timeout: 60 * 1000, // 60 seconds for performance tests
      retries: process.env.CI ? 1 : 0,
    },

    // Edge case tests - allow 2 retries
    {
      name: 'edge-cases',
      testDir: './tests/e2e/edge-cases',
      use: { ...devices['Desktop Chrome'] },
      retries: process.env.CI ? 2 : 0,
    },

    // Legacy/existing tests (system-mode, user-journey, etc.)
    {
      name: 'legacy',
      testDir: './tests/e2e',
      testMatch: ['system-mode.spec.ts', 'user-journey.spec.ts', 'event-flows.spec.ts', 'metrics-updates.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
      retries: process.env.CI ? 2 : 0,
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
