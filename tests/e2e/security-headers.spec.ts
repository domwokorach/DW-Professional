import { expect, test } from '@playwright/test';

test.describe('security headers', () => {
  test('the public site sends baseline headers and a report-only CSP (never an enforcing one)', async ({ request }) => {
    const response = await request.get('/en-gb');
    const h = response.headers();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('SAMEORIGIN');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
    expect(h['x-powered-by']).toBeUndefined();
    expect(h['content-security-policy']).toBeUndefined();
    expect(h['content-security-policy-report-only']).toContain("default-src 'self'");
    expect(h['content-security-policy-report-only']).toContain("object-src 'none'");
    expect(h['reporting-endpoints']).toContain('/api/csp-report');
  });

  test('admin routes are stricter and unauthenticated admin APIs are refused', async ({ request }) => {
    const page = await request.get('/admin/login', { headers: { 'x-forwarded-proto': 'https' } });
    expect(page.headers()['x-frame-options']).toBe('DENY');
    expect(page.headers()['cache-control']).toBe('no-store');
    expect(page.headers()['content-security-policy-report-only']).toContain("frame-ancestors 'none'");
    const api = await request.get('/api/admin/comments', { headers: { 'x-forwarded-proto': 'https' } });
    expect(api.status()).toBe(401);
  });

  test('security.txt is published', async ({ request }) => {
    const response = await request.get('/.well-known/security.txt');
    expect(response.status()).toBe(200);
    expect(await response.text()).toMatch(/^Contact: mailto:/m);
  });

  test('the home page triggers no CSP violations (report-only policy would not break it)', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __csp: string[] }).__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __csp: string[] }).__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
    });
    await page.goto('/en-gb');
    await page.waitForTimeout(2000);
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(200); }
    expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([]);
  });
});
