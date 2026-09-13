import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const OUT = '/private/tmp/claude-501/-Users-dominicolanya-Developer-dw-test-developer/5c68c1d7-b2a7-42da-b03d-1af1ebc4e884/scratchpad/shots';
mkdirSync(OUT, { recursive: true });

const sizes = [
  { name: '320x568', width: 320, height: 568 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

// Log in via the API directly so cookies land in this context.
const loginRes = await page.request.post(`${BASE}/api/auth/sign-in`, {
  data: {
    email: 'dominic.wokorach-o@outlook.com',
    password: '7EL=KPZfW&ugkmrRh58oJ-DD',
    rememberMe: true,
  },
});
console.log('login status', loginRes.status());
if (!loginRes.ok()) {
  console.log(await loginRes.text());
  process.exit(1);
}

for (const size of sizes) {
  await page.setViewportSize({ width: size.width, height: size.height });
  await page.goto(`${BASE}/en-gb/admin/chat`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/list-${size.name}.png`, fullPage: false });

  // Try to click the first conversation item, if any, to capture the conversation view too.
  const firstItem = page.locator('[data-sidebar="menu-button"]').first();
  if (await firstItem.count() > 0) {
    await firstItem.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/conversation-${size.name}.png`, fullPage: false });

    // On mobile widths, click the details info button if present.
    if (size.width < 1200) {
      const detailsTrigger = page.getByRole('button', { name: /conversation actions/i });
      if (await detailsTrigger.count() > 0) {
        await detailsTrigger.click();
        await page.waitForTimeout(300);
        const detailsMenuItem = page.getByText(/candidate details/i);
        if (await detailsMenuItem.count() > 0) {
          await detailsMenuItem.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: `${OUT}/details-${size.name}.png`, fullPage: false });
          await page.keyboard.press('Escape');
        }
      }
    }

    // back to list (mobile only meaningful, harmless elsewhere)
    const backBtn = page.getByRole('button', { name: /back to conversations/i });
    if (await backBtn.count() > 0 && size.width < 768) {
      await backBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/back-to-list-${size.name}.png`, fullPage: false });
    }
  } else {
    console.log(`no conversations found at ${size.name}`);
  }
}

await browser.close();
console.log('done');
