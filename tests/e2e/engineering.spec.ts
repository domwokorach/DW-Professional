import { expect, test } from '@playwright/test';

test.describe('engineering section', () => {
  test('shows the heading and exactly ten numbered cards', async ({ page }) => {
    await page.goto('/en-gb');
    const section = page.locator('#engineering');
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('heading', { level: 2 })).toContainText('Built. Tested. Delivered.');
    const cards = section.locator('.eng-card');
    await expect(cards).toHaveCount(10);
    const numbers = await cards.locator('.eng-card__num').allTextContents();
    expect(numbers).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  });

  test('every link is an exact GitHub URL, opens in a new tab and is safe', async ({ page }) => {
    await page.goto('/en-gb');
    const links = await page.locator('#engineering a').evaluateAll((as) =>
      as.map((a) => ({ href: (a as HTMLAnchorElement).href, target: (a as HTMLAnchorElement).target, rel: (a as HTMLAnchorElement).rel })),
    );
    expect(links.length).toBeGreaterThanOrEqual(15);
    for (const l of links) {
      expect(l.href).toMatch(/^https:\/\/github\.com\/domwokorach\/DW-Professional(\/|$)/);
      expect(l.target).toBe('_blank');
      expect(l.rel).toContain('noopener');
    }
    for (const label of ['View GitHub Source Code', 'View CI/CD Pipelines', 'Explore Automated Tests', 'View Jenkins Pipeline', 'View Engineering Documentation']) {
      await expect(page.locator('#engineering').getByRole('link', { name: new RegExp(label) })).toBeVisible();
    }
  });

  test('live status resolves to real data or an explicit unavailable state, never stays "checking"', async ({ page }) => {
    await page.goto('/en-gb');
    const note = page.locator('#engineering .eng-live__note');
    await note.scrollIntoViewIfNeeded();
    await expect(note).not.toHaveText(/Checking live status/, { timeout: 20_000 });
    await expect(note).toHaveText(/Last verified|Showing stale data|unavailable/);
  });

  test('status API returns the documented shape and is cacheable', async ({ request }) => {
    const res = await request.get('/api/engineering/status');
    expect(res.status()).toBe(200);
    expect(res.headers()['cache-control']).toMatch(/s-maxage/);
    const body = await res.json();
    for (const key of ['fetchedAt', 'stale', 'ci', 'deployment', 'jenkins', 'commit', 'report', 'lastSuccessfulBuild']) expect(body).toHaveProperty(key);
    expect(['passed', 'failed', 'running', 'pending', 'cancelled', 'not_configured', 'unavailable']).toContain(body.ci.state);
    const text = JSON.stringify(body).toLowerCase();
    expect(text).not.toMatch(/token|secret|authorization|password/);
  });
});

test('security headers are set once on public pages', async ({ request }) => {
  const res = await request.get('/en-gb');
  const h = res.headers();
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('SAMEORIGIN');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['permissions-policy']).toContain('camera=(self)');
});
