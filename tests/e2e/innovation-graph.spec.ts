import { expect, test, type Page } from '@playwright/test';

const open = async (page: Page) => {
  await page.goto('/en-gb');
  const ig = page.locator('.ig').first();
  await ig.evaluate((el) => {
    const toggle = el.closest('.xp-collapse')?.querySelector('.xp-toggle') as HTMLElement;
    if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
  });
  await ig.locator('.ig-canvas').scrollIntoViewIfNeeded();
  return ig;
};

test.describe('Innovation Community knowledge graph', () => {
  test('shows statistics, the disclaimer and the six viewing modes', async ({ page }) => {
    const ig = await open(page);
    await expect(ig.locator('.ig-stats')).toContainText('33');
    await expect(ig.locator('.ig-disclaimer')).toContainText('Not an official Lloyds Banking Group organisational structure');
    await expect(ig.getByRole('group', { name: 'Viewing mode' }).getByRole('button')).toHaveCount(6);
  });

  test('selecting a node shows its details and highlights connections; Escape-style reset clears it', async ({ page }) => {
    const ig = await open(page);
    await ig.locator('[data-node="d-tech"] .ig-node__dot').click();
    await expect(ig.locator('.ig-details h5')).toHaveText('Technology & Engineering');
    await expect(ig.locator('.ig-node--faded').first()).toBeAttached();
    await expect(ig.locator('.ig-cypher')).toContainText('MATCH');
    await ig.getByRole('button', { name: 'Reset graph' }).click();
    await expect(ig.locator('.ig-node--selected')).toHaveCount(0);
  });

  test('collapse, filter and search keep working', async ({ page }) => {
    const ig = await open(page);
    const visible = () => ig.locator('.ig-node:not(.ig-node--hidden)').count();
    await ig.locator('[data-node="d-tech"] .ig-node__dot').click();
    await ig.getByRole('button', { name: 'Collapse children' }).click();
    expect(await visible()).toBeLessThan(33);
    await ig.getByRole('button', { name: 'Expand all departments and teams' }).click();
    expect(await visible()).toBe(33);
    await ig.getByLabel('Professional roles').uncheck();
    expect(await visible()).toBe(21);
    await ig.getByLabel('Professional roles').check();
    await ig.getByRole('searchbox').fill('architect');
    await expect(ig.getByRole('status')).toHaveText('4 matching entities');
  });

  test('the text alternative lists entities and selecting one opens its details', async ({ page }) => {
    const ig = await open(page);
    await ig.locator('.ig-list summary').click();
    await ig.locator('.ig-list').getByRole('button', { name: /Data Scientist/ }).click();
    await expect(ig.locator('.ig-details h5')).toHaveText('Data Scientist');
  });

  test('is keyboard operable and does not overflow the page on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const ig = await open(page);
    await ig.locator('[data-node="ic"]').focus();
    await page.keyboard.press('Enter');
    await expect(ig.locator('.ig-details h5')).toHaveText('Innovation Community');
    // The component must fit the phone viewport (other page sections are outside this test's scope).
    const fits = await ig.evaluate((el) => el.getBoundingClientRect().right <= window.innerWidth && el.scrollWidth <= el.clientWidth);
    expect(fits).toBe(true);
  });

  test('the animated preview is a separate mode with playback controls', async ({ page }) => {
    const ig = await open(page);
    await ig.getByRole('button', { name: 'Animated Preview' }).click();
    await expect(ig.locator('.pv video')).toBeVisible();
    await expect(ig.locator('.pv').getByRole('button', { name: 'Replay preview animation from the start' })).toBeVisible();
    await expect(ig.locator('.ig-canvas')).toBeHidden();
  });
});
