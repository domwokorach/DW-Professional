import { expect, test, type Page } from '@playwright/test';

const IDS = ['the-daily-wire', 'azure-devops-dashboard', 'british-streaming'];
const card = (page: Page, id: string) => page.locator(`[data-xp-card="${id}"]`);
/** Clicks until the dialog appears: the server-rendered button can be clicked before React has hydrated its handler. */
const open = (page: Page, id: string) => expect(async () => {
  await card(page, id).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1500 });
}).toPass({ timeout: 15_000 });

test.describe('expandable project gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en-gb');
    const reject = page.getByRole('button', { name: /reject all/i });
    if (await reject.isVisible().catch(() => false)) await reject.click();
    await card(page, IDS[0]).scrollIntoViewIfNeeded();
  });

  for (const id of IDS) {
    test(`${id}: opens with Enter, traps focus, locks scroll, Escape closes and restores focus`, async ({ page }) => {
      await card(page, id).focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: /^Close/ })).toBeFocused();
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true);
      }
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(card(page, id)).toBeFocused();
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
    });
  }

  test('close button and click-outside both dismiss', async ({ page }) => {
    await open(page, IDS[0]);
    await page.getByRole('dialog').getByRole('button', { name: /^Close/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await open(page, IDS[1]);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.mouse.click(4, 4);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('View Project is a real new-tab link and does not close the dialog', async ({ page }) => {
    await open(page, IDS[1]);
    const link = page.getByRole('dialog').getByRole('link');
    await expect(link).toHaveAttribute('href', 'https://azure-devops-dashboard-chi.vercel.app/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await link.evaluate((a) => a.addEventListener('click', (e) => e.preventDefault(), { once: true }));
    await link.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('reduced motion still opens and closes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, IDS[0]);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('expanded content scrolls and has no horizontal overflow', async ({ page }) => {
    await open(page, IDS[2]);
    await expect(page.getByRole('dialog')).toBeVisible();
    const m = await page.evaluate(() => {
      const s = document.querySelector('.xp-scroll')!;
      return { scrolls: s.scrollHeight > s.clientHeight || s.scrollHeight <= window.innerHeight, h: document.documentElement.scrollWidth > innerWidth };
    });
    expect(m.h).toBe(false);
    expect(m.scrolls).toBe(true);
  });
});
