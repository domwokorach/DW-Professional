import { expect, test } from '@playwright/test';

test.describe('public site', () => {
  test('root redirects to the portfolio and the page renders', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/en-gb\/?$/);
    await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('has no uncaught page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/en-gb');
    await page.waitForLoadState('load');
    expect(errors).toEqual([]);
  });

  test('primary navigation is reachable and labelled', async ({ page, isMobile }) => {
    await page.goto('/en-gb');
    if (isMobile) await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const nav = page.getByRole('navigation', { name: 'Primary navigation' }).filter({ visible: true }).first();
    await expect(nav).toBeVisible();
    expect(await nav.locator('a, button').count()).toBeGreaterThan(2);
  });

  for (const path of ['/privacy', '/terms', '/cookies', '/accessibility']) {
    test(`legal page ${path} renders`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }

  test('theme toggle switches between light and dark and persists', async ({ page, isMobile }) => {
    await page.goto('/en-gb');
    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    if (isMobile) await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.getByRole('button', { name: /theme|dark|light/i }).filter({ visible: true }).first().click();
    const after = await html.getAttribute('data-theme');
    expect(after).not.toBe(before);
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', after!);
  });

  test('unknown routes return 404', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');
    expect(response?.status()).toBe(404);
  });
});

test.describe('security surface', () => {
  test('admin pages and APIs do not serve data without a session', async ({ request }) => {
    const api = await request.get('/api/admin/comments', { maxRedirects: 0 });
    expect([401, 403, 307, 308]).toContain(api.status());
    const page = await request.get('/admin/portfolio-access', { maxRedirects: 0 });
    expect([307, 308, 401, 403]).toContain(page.status());
  });
});
