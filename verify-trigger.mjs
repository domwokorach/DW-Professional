import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
await page.goto("http://localhost:3002/", { waitUntil: "networkidle", timeout: 45000 });
const html = await page.locator('[data-slot="navigation-menu-trigger"]').evaluateAll((els) =>
  els.map((el) => ({ tag: el.tagName, outer: el.outerHTML.slice(0, 400), visible: !!el.offsetParent }))
);
console.log(JSON.stringify(html, null, 2));
await browser.close();
