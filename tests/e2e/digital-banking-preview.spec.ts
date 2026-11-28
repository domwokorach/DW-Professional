import { expect, test } from '@playwright/test';

const open = async (page: import('@playwright/test').Page) => {
  await page.goto('/en-gb');
  const video = page.locator('.xp-projects__preview .pv video');
  await video.evaluate((el) => (el.closest('.xp-collapse')?.querySelector('.xp-toggle') as HTMLElement).getAttribute('aria-expanded') === 'true' || (el.closest('.xp-collapse')?.querySelector('.xp-toggle') as HTMLElement).click());
  await video.scrollIntoViewIfNeeded();
  return video;
};

test.describe('digital banking testing preview', () => {
  test('is labelled as an illustrative reconstruction and offers playback controls', async ({ page }) => {
    const video = await open(page);
    const group = page.locator('.xp-projects__preview', { has: page.locator('.pv') });
    await expect(group).toContainText('Illustrative reconstruction');
    await expect(video).toHaveAttribute('poster', /digital-banking-testing-poster\.webp$/);
    await expect(page.locator('.xp-projects__preview .pv').getByRole('button', { name: 'Replay preview animation from the start' })).toBeVisible();
  });

  test('pause and play work', async ({ page }) => {
    const video = await open(page);
    await expect.poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused), { timeout: 15_000 }).toBe(true);
    await page.locator('.xp-projects__preview .pv').getByRole('button', { name: 'Pause preview animation', exact: true }).click();
    await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
    await page.locator('.xp-projects__preview .pv').getByRole('button', { name: 'Play preview animation', exact: true }).click();
    await expect.poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);
  });

  test('does not autoplay with reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    const video = await open(page);
    await page.waitForTimeout(1500);
    expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
    await context.close();
  });
});
