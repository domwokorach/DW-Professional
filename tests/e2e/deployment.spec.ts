import { expect, test } from '@playwright/test';

// Post-deployment smoke tests. Run against the real deployed URL:
//   PLAYWRIGHT_BASE_URL=https://www.dominicwokorach.me npx playwright test --project=smoke
// Read-only: no forms are submitted and no data is written.
test.describe('deployed site', () => {
  test('homepage is available and renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const response = await page.goto('/en-gb');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    expect(errors, 'uncaught runtime errors on the homepage').toEqual([]);
  });

  test('root redirects to the portfolio', async ({ request }) => {
    const response = await request.get('/', { maxRedirects: 0 });
    expect([307, 308]).toContain(response.status());
    expect(response.headers()['location']).toMatch(/\/en-gb$/);
  });

  test('essential navigation and legal pages respond', async ({ request }) => {
    for (const path of ['/privacy', '/terms', '/cookies', '/accessibility']) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
    }
  });

  test('static assets load', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => {
      const url = new URL(r.url());
      if (url.origin === new URL(page.url() || 'http://x').origin && /\/_next\/static\//.test(url.pathname) && r.status() >= 400) failed.push(`${r.status()} ${url.pathname}`);
    });
    await page.goto('/en-gb');
    await page.waitForLoadState('load');
    expect(failed).toEqual([]);
    const favicon = await page.request.get('/icon.svg');
    expect(favicon.status()).toBe(200);
  });

  test('protected routes and APIs do not leak data', async ({ request }) => {
    const admin = await request.get('/admin/portfolio-access', { maxRedirects: 0 });
    expect([307, 308, 401, 403]).toContain(admin.status());
    const api = await request.get('/api/admin/comments', { maxRedirects: 0 });
    expect([307, 308, 401, 403]).toContain(api.status());
  });

  test('security headers are present', async ({ request }) => {
    const headers = (await request.get('/en-gb')).headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('responsive: no horizontal overflow on a phone', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    await page.goto('/en-gb');
    await page.waitForLoadState('load');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await context.close();
  });
});
