import { expect, test } from '@playwright/test';

test.describe('employer history', () => {
  test('heading, tag and the seven timeline entries in order', async ({ page }) => {
    await page.goto('/en-gb');
    const section = page.locator('#experience');
    await expect(section.locator('.section-tag')).toContainText('EMPLOYER HISTORY');
    await expect(section.getByRole('heading', { level: 2, name: 'My professional journey.' })).toBeVisible();
    const links = await section.getByRole('navigation', { name: 'Career timeline' }).getByRole('link').allTextContents();
    expect(links.map((t) => t.replace(/\s+/g, ' ').trim())).toEqual([
      '2024 Freelance', '2024 Sky', '2022 Travel', '2014 Lloyds Banking Group', '2013 Leonard Cheshire', '2013 Lion Web Vision', '2005 Education',
    ]);
  });

  test('selecting an entry scrolls to it and highlights it for sighted and screen-reader users', async ({ page }) => {
    await page.goto('/en-gb');
    const nav = page.getByRole('navigation', { name: 'Career timeline' });
    await nav.scrollIntoViewIfNeeded();
    await nav.getByRole('link', { name: /Lloyds Banking Group/ }).click();
    const lloyds = page.locator('article.xp-group');
    await expect(lloyds).toBeInViewport({ ratio: 0.1 });
    await expect(nav.getByRole('link', { name: /Lloyds Banking Group/ })).toHaveAttribute('aria-current', 'location', { timeout: 10_000 });
    await expect(nav.locator('[aria-current="location"]')).toHaveCount(1);
  });

  test('Lloyds groups four roles under one employer with its career progression', async ({ page }) => {
    await page.goto('/en-gb');
    const lloyds = page.locator('article.xp-group');
    await expect(lloyds.getByRole('heading', { level: 3, name: 'Lloyds Banking Group' })).toBeVisible();
    await expect(lloyds).toContainText('Career progression: 4 roles');
    await expect(lloyds).toContainText('5 years 3 months');
    await expect(lloyds.locator('li.xp-role')).toHaveCount(4);
  });

  test('details expand and collapse with the keyboard', async ({ page }) => {
    await page.goto('/en-gb');
    const toggle = page.locator('#experience .xp-toggle').nth(1); // second entry (Sky): collapsed by default
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('the career break is not presented as employment', async ({ page }) => {
    await page.goto('/en-gb');
    const travel = page.locator('article.xp-entry--career-break');
    await expect(travel).toContainText('Career Break');
    await expect(travel).toContainText('2 years 6 months');
    await expect(travel).not.toContainText('Remote');
  });

  test('freelance projects: eight, each with a safe external link', async ({ page }) => {
    await page.goto('/en-gb');
    const freelance = page.locator('#experience article.xp-entry').first();
    const items = freelance.locator('.xp-projects__list > li');
    await expect(items).toHaveCount(8);
    const hrefs = await freelance.locator('.xp-projects__link').evaluateAll((as) => as.map((a) => ({ h: (a as HTMLAnchorElement).href, t: (a as HTMLAnchorElement).target, r: (a as HTMLAnchorElement).rel })));
    expect(hrefs).toHaveLength(8);
    for (const l of hrefs) { expect(l.h).toMatch(/^https:\/\//); expect(l.t).toBe('_blank'); expect(l.r).toContain('noopener'); }
  });
});
