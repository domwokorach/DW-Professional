import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Automated axe-core checks against WCAG 2.0/2.1/2.2 A and AA rules, in both themes.
// Automated checks find only a subset of issues; manual VoiceOver/TalkBack review is in docs/ACCESSIBILITY.md.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PAGES = ['/en-gb', '/privacy', '/terms', '/cookies', '/accessibility'];
const THEMES = ['light', 'dark'] as const;

async function setTheme(page: Page, theme: (typeof THEMES)[number]) {
  await page.addInitScript((t) => window.localStorage.setItem('portfolio-theme', t), theme);
}

for (const theme of THEMES) {
  for (const path of PAGES) {
    test(`axe: ${path} (${theme})`, async ({ page }) => {
      await setTheme(page, theme);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await page.waitForLoadState('load');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.nodes[0]?.target.join(' ')}`);
      expect(summary, `axe violations on ${path} in ${theme} theme`).toEqual([]);
    });
  }
}

test('keyboard: first Tab stop is visible and focus is indicated', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard focus order is covered on desktop');
  await page.goto('/en-gb');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
  const outline = await focused.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), shadow: s.boxShadow };
  });
  expect(outline.style !== 'none' && outline.width > 0 || outline.shadow !== 'none').toBe(true);
});

test('external links open safely in a new tab', async ({ page }) => {
  await page.goto('/en-gb');
  const links = await page.locator('a[target="_blank"]').evaluateAll((as) => as.map((a) => ({ href: (a as HTMLAnchorElement).href, rel: (a as HTMLAnchorElement).rel })));
  const unsafe = links.filter((l) => !/noopener/.test(l.rel));
  expect(unsafe).toEqual([]);
});

// Known gap, documented in docs/ACCESSIBILITY.md: the GitHub contribution grid cells (.gh-cell) are 17px.
// Anything else under 24px fails this test, so new regressions are caught.
const KNOWN_SMALL_TARGETS = '.gh-cell';

test('mobile touch targets meet WCAG 2.2 SC 2.5.8 (24x24, or 24px spacing exception)', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/en-gb');
  await page.waitForTimeout(1000);
  const failing = await page.evaluate((known) => {
    const els = [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [role="button"]')]
      .filter((el) => !el.matches(known))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.height > 0);
    const inline = (el: HTMLElement) => el.tagName === 'A' && !!el.closest('p, li, dd') && getComputedStyle(el).display === 'inline';
    const touches = (cx: number, cy: number, r: DOMRect) => {
      const dx = Math.max(r.left - cx, 0, cx - r.right), dy = Math.max(r.top - cy, 0, cy - r.bottom);
      return dx * dx + dy * dy < 144; // circle of radius 12px
    };
    return els
      .filter(({ r }) => r.width < 24 || r.height < 24)
      .filter(({ el }) => !inline(el))
      .filter(({ el, r }) => {
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        return els.some((o) => o.el !== el && !o.el.contains(el) && !el.contains(o.el) && touches(cx, cy, o.r));
      })
      .map(({ el, r }) => `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
  }, KNOWN_SMALL_TARGETS);
  expect(failing).toEqual([]);
});
