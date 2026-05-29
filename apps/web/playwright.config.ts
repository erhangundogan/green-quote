import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000';
const isRemote = !baseURL.startsWith('http://localhost');

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : 4,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Skip the local dev server when running against a remote URL (e.g. Vercel).
  // Set PLAYWRIGHT_BASE_URL=https://green-quote-gray.vercel.app to run E2E
  // against the deployed app without needing a local database.
  ...(isRemote
    ? {}
    : {
        webServer: {
          command: 'yarn dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env['CI'],
          timeout: 120_000,
        },
      }),
});
