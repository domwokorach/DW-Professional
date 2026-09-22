import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", String(e)));
await page.goto("http://localhost:3002/", { waitUntil: "networkidle", timeout: 45000 });

const hamburger = page.locator('header button[aria-controls="mobile-menu"]');
await hamburger.click();
await page.waitForTimeout(500);
const panel = page.locator("#mobile-menu");
console.log("panel visible:", await panel.isVisible());
const linkTexts = await panel.locator("li button").allTextContents();
console.log("mobile links:", JSON.stringify(linkTexts));
console.log("panel scrollHeight vs viewport:", await panel.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight })));

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
console.log("horizontal overflow with menu open:", overflow);

await panel.locator("li button", { hasText: "06 / Gallery" }).click();
await page.waitForTimeout(500);
console.log("url after click:", page.url());
console.log("panel visible after click (should be false):", await panel.isVisible().catch(() => false));

// reopen, check controls present: language, resume, get in touch, theme
await hamburger.click();
await page.waitForTimeout(400);
const controlsText = await panel.locator("button, [role=button]").allTextContents();
console.log("controls in panel:", JSON.stringify(controlsText.filter(Boolean)));

await page.locator("header").screenshot({ path: "nav-shots/mobile-390-open.png" }).catch(()=>{});
await browser.close();
