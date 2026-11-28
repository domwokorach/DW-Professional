import { defineConfig, devices } from '@playwright/test';

// PLAYWRIGHT_BASE_URL set  -> test that deployed/running URL, start nothing (used for post-deploy smoke tests).
// otherwise                -> start the app: `next dev` locally, `next start` in CI (after `npm run build`).
const remote = process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.PORT ?? 3100);
const baseURL = remote ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/e2e.xml' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'chromium', testIgnore: /a11y|deployment/, use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testIgnore: /a11y|deployment/, use: { ...devices['Pixel 7'] } },
    { name: 'a11y', testMatch: /a11y\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'a11y-mobile', testMatch: /a11y\.spec\.ts/, use: { ...devices['Pixel 7'] } },
    { name: 'smoke', testMatch: /deployment\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: remote
    ? undefined
    : {
        command: process.env.CI ? `npx next start -p ${port}` : `npx next dev -p ${port}`,
        url: `${baseURL}/en-gb`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
