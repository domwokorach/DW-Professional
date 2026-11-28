import { expect, test, type Page } from '@playwright/test';

/** Opens every collapsed experience card until the email preview is visible. */
async function reveal(page: Page) {
  await page.goto('/en-gb');
  const reject = page.getByRole('button', { name: /reject all/i });
  if (await reject.isVisible().catch(() => false)) await reject.click();
  const hep = page.locator('.hep').first();
  // Open only the collapsed cards that contain the preview (outer employer card, then the role).
  for (let pass = 0; pass < 4 && !(await hep.isVisible()); pass++) {
    await page.evaluate(() => {
      for (const t of document.querySelectorAll<HTMLElement>('#experience .xp-toggle[aria-expanded="false"]')) {
        if (document.getElementById(t.getAttribute('aria-controls') ?? '')?.querySelector('.hep')) t.click();
      }
    });
    await page.waitForTimeout(400);
  }
  await hep.scrollIntoViewIfNeeded();
  await expect(hep).toBeVisible();
  return hep;
}

test.describe('HTML email preview', () => {
  test('desktop/mobile switch, source view, reset, and the disclaimer', async ({ page }) => {
    const hep = await reveal(page);
    const device = hep.locator('.hep__device');
    await expect(device).toHaveAttribute('data-mode', 'desktop');
    await hep.getByRole('button', { name: 'Mobile' }).click();
    await expect(device).toHaveAttribute('data-mode', 'mobile');
    await expect.poll(async () => (await device.boundingBox())?.width).toBeCloseTo(375, -1);
    await expect(hep.getByRole('button', { name: 'Mobile' })).toHaveAttribute('aria-pressed', 'true');
    await hep.getByRole('button', { name: 'View HTML' }).click();
    await expect(hep.getByLabel('HTML source of the Internal Communications email')).toContainText('<!DOCTYPE html>');
    await hep.getByRole('button', { name: 'Reset' }).click();
    await expect(device).toHaveAttribute('data-mode', 'desktop');
    await expect(hep.locator('iframe')).toBeVisible();
    await expect(page.getByText(/Not an official Lloyds Banking Group communication/).first()).toBeVisible();
  });

  test('the email is sandboxed (no scripts) and shows the specified content', async ({ page }) => {
    const hep = await reveal(page);
    await expect(hep.locator('iframe')).toHaveAttribute('sandbox', '');
    const frame = page.frameLocator('.hep iframe').first();
    await expect(frame.getByRole('heading', { level: 1, name: 'Keeping our colleagues connected.' })).toBeVisible();
    await expect(frame.getByRole('link', { name: 'Explore Internal Updates' })).toBeVisible();
    await expect(frame.getByRole('heading', { name: 'Engineering & Collaboration' })).toBeVisible();
  });

  test('copy HTML puts the email source on the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const hep = await reveal(page);
    await hep.getByRole('button', { name: 'Copy HTML' }).click();
    await expect(hep.getByRole('button', { name: 'Copied' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^<!DOCTYPE html>/);
  });

  test('full screen opens a modal, Escape closes it and returns focus', async ({ page }) => {
    const hep = await reveal(page);
    await hep.getByRole('button', { name: 'Full screen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Full-screen email preview' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Mobile' }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(hep.getByRole('button', { name: 'Full screen' })).toBeFocused();
    await expect(hep.locator('.hep__device')).toHaveAttribute('data-mode', 'mobile');
  });

  test('template selector keeps preview, source and copied HTML in sync', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const hep = await reveal(page);
    const frame = page.frameLocator('.hep iframe').first();
    const cases = [
      ['Events', 'Learn, connect and grow together.', 'View Upcoming Events'],
      ['News', 'What is new across the organisation.', 'Read the Latest News'],
      ['Welcome to New Colleagues', 'Welcome to the team.', 'Start Your Onboarding'],
      ['Internal Communications', 'Keeping our colleagues connected.', 'Explore Internal Updates'],
    ] as const;
    for (const [tab, headline, cta] of cases) {
      await hep.getByRole('button', { name: tab, exact: true }).click();
      await expect(hep.getByRole('button', { name: tab, exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(frame.getByRole('heading', { level: 1, name: headline })).toBeVisible();
      await expect(frame.getByRole('link', { name: cta })).toBeVisible();
      await hep.getByRole('button', { name: 'View HTML' }).click();
      await expect(hep.getByLabel(`HTML source of the ${tab} email`)).toContainText(headline);
      await hep.getByRole('button', { name: 'Copy HTML' }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(headline);
      await hep.getByRole('button', { name: 'View email' }).click();
    }
    await hep.getByRole('button', { name: 'Events', exact: true }).click();
    await hep.getByRole('button', { name: 'Reset' }).click();
    await expect(hep.getByRole('button', { name: 'Internal Communications', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('every template loads sharp images at 2x with no horizontal overflow, in both modes', async ({ page }) => {
    const hep = await reveal(page);
    const frame = page.frameLocator('.hep iframe').first();
    for (const tab of ['Internal Communications', 'Events', 'News', 'Welcome to New Colleagues']) {
      await hep.getByRole('button', { name: tab, exact: true }).click();
      for (const mode of ['Desktop', 'Mobile']) {
        await hep.getByRole('button', { name: mode, exact: true }).click();
        await expect(frame.locator('img')).toHaveCount(4);
        await expect.poll(() => frame.locator('body').evaluate(async () => {
          const imgs = [...document.images];
          await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
          return {
            broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).length,
            soft: imgs.filter((i) => i.naturalWidth < i.getBoundingClientRect().width * 1.99).length,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        })).toEqual({ broken: 0, soft: 0, overflow: 0 });
      }
    }
  });

  test('the email stays light and readable when the portfolio is in dark mode', async ({ page }) => {
    const hep = await reveal(page);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const bg = await page.frameLocator('.hep iframe').first().locator('body').evaluate((b) => getComputedStyle(b).backgroundColor);
    expect(bg).toBe('rgb(242, 245, 243)');
    await expect(page.frameLocator('.hep iframe').first().getByRole('heading', { level: 1 })).toBeVisible();
    await expect(hep.getByRole('button', { name: 'Desktop' })).toBeVisible();
  });

  test('reduced motion still switches layouts', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const hep = await reveal(page);
    await hep.getByRole('button', { name: 'Mobile' }).click();
    await expect(hep.locator('.hep__device')).toHaveAttribute('data-mode', 'mobile');
  });

  for (const width of [1440, 834, 390, 320]) {
    test(`preview stays inside the viewport at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const hep = await reveal(page);
      const over = await hep.evaluate((el) => [...el.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && !e.closest('.hep__source'); }).length);
      expect(over).toBe(0);
    });
  }
});
