import { expect, test, type Page } from '@playwright/test';

const TITLES = [
  'Telecom Customer Portal',
  'PayFlow Acceptance Solution Platform',
  'Detection Monitor Platform',
  'HR Connect Dashboard',
  'Meridian Digital Banking',
  'The Daily Wire News',
  'Azure DevOps Dashboard',
  'British Streaming — Web App, iOS & Android',
];
const carousel = (page: Page) => page.getByRole('region', { name: 'Projects', exact: true });
const dot = (page: Page, n: number) => carousel(page).getByRole('button', { name: new RegExp(`^Show project ${n} of 8`) });
const status = (page: Page) => carousel(page).locator('[aria-live]');
const heading = (page: Page) => page.locator('.pcr__title');
const visibleCount = (page: Page) => page.locator('.pcr__slide:not([inert])').evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) > 0.2).length);
/** Clicks until the dialog appears: the server-rendered button can be clicked before React has hydrated its handler. */
const openDetails = (page: Page) => expect(async () => {
  await page.locator('[data-pcr-open]').click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1500 });
}).toPass({ timeout: 15_000 });

test.describe('project carousel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en-gb');
    const reject = page.getByRole('button', { name: /reject all/i });
    if (await reject.isVisible().catch(() => false)) await reject.click();
    await carousel(page).scrollIntoViewIfNeeded();
  });

  test('opens on a project with a screenshot and exposes all eight via pagination', async ({ page }) => {
    await expect(heading(page)).toHaveText(TITLES[5]);
    await expect(carousel(page).getByRole('button', { name: /^Show project/ })).toHaveCount(8);
    for (let i = 0; i < 8; i++) {
      await dot(page, i + 1).click();
      await expect(heading(page)).toHaveText(TITLES[i]);
      await expect(status(page)).toHaveText(`Project ${i + 1} of 8: ${TITLES[i]}`);
      await expect(dot(page, i + 1)).toHaveAttribute('aria-current', 'true');
    }
  });

  test('desktop shows five stacked cards; only the centre is exposed to assistive tech', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect.poll(() => visibleCount(page)).toBe(5);
    await expect(page.locator('.pcr__slide:not([aria-hidden="true"])')).toHaveCount(1);
  });

  test('arrows and keyboard wrap around circularly', async ({ page }) => {
    await dot(page, 8).click();
    await carousel(page).getByRole('button', { name: 'Next project' }).click();
    await expect(heading(page)).toHaveText(TITLES[0]);
    await carousel(page).getByRole('button', { name: 'Previous project' }).click();
    await expect(heading(page)).toHaveText(TITLES[7]);
    await carousel(page).focus();
    await page.keyboard.press('ArrowRight');
    await expect(heading(page)).toHaveText(TITLES[0]);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(heading(page)).toHaveText(TITLES[6]);
  });

  test('clicking a neighbouring card centres it; dragging swipes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const near = (await page.locator('.pcr__slide[data-offset="1"]').boundingBox())!;
    // The visible sliver of the next card is its right-hand edge; the rest sits behind the centre card.
    await page.mouse.click(near.x + near.width * 0.94, near.y + near.height / 2);
    await expect(heading(page)).toHaveText(TITLES[6]);
    const box = (await page.locator('.pcr__stage').boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2 + 200, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 100, y, { steps: 8 });
    await page.mouse.up();
    await expect(heading(page)).toHaveText(TITLES[7]);
  });

  test('View details opens the dialog without moving the carousel; Escape restores focus', async ({ page }) => {
    await dot(page, 8).click();
    await openDetails(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /^Close/ })).toBeFocused();
    await expect(dialog.getByRole('heading', { name: TITLES[7] })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-pcr-open]')).toBeFocused();
    await expect(heading(page)).toHaveText(TITLES[7]);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });

  test('close button and click-outside both dismiss', async ({ page }) => {
    await openDetails(page);
    await page.getByRole('dialog').getByRole('button', { name: /^Close/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await openDetails(page);
    await page.mouse.click(4, 4);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('View Project is a real new-tab link and does not close the dialog', async ({ page }) => {
    await dot(page, 7).click();
    await openDetails(page);
    const link = page.getByRole('dialog').getByRole('link');
    await expect(link).toHaveAttribute('href', 'https://azure-devops-dashboard-chi.vercel.app/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await link.evaluate((a) => a.addEventListener('click', (e) => e.preventDefault(), { once: true }));
    await link.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('every screenshot loads (including British Streaming)', async ({ page }) => {
    await expect.poll(() => page.locator('.pcr__slide img').evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toEqual([true, true, true]);
  });

  test('reduced motion still navigates and opens details', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await carousel(page).getByRole('button', { name: 'Next project' }).click();
    await expect(heading(page)).toHaveText(TITLES[6]);
    await openDetails(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  for (const width of [1920, 1440, 1024, 834, 768, 390, 320]) {
    test(`carousel and dialog stay inside the viewport at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await expect(carousel(page)).toBeVisible();
      // Page-level overflow from other sections (hero, logo loop) is out of scope: measure this section's own content.
      const overflowing = () => page.evaluate(() => [...document.querySelectorAll('.pcr *, .xp-layer *')].filter((e) => { const r = e.getBoundingClientRect(); return (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.pcr__track') && getComputedStyle(e).position !== 'fixed'; }).length);
      expect(await overflowing()).toBe(0);
      await openDetails(page);
      expect(await overflowing()).toBe(0);
    });
  }
});
