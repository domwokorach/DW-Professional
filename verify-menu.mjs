import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", String(e)));
await page.goto("http://localhost:3002/", { waitUntil: "networkidle", timeout: 45000 });

const trigger = page.locator('header [data-slot="navigation-menu-trigger"]');
console.log("trigger visible:", await trigger.isVisible());
console.log("trigger aria-label before:", await trigger.getAttribute("aria-label"));

await trigger.click();
await page.waitForTimeout(400);
console.log("trigger aria-expanded after click:", await trigger.getAttribute("aria-expanded"));
console.log("trigger aria-label after click:", await trigger.getAttribute("aria-label"));

const popup = page.locator('[data-slot="navigation-menu-popup"]');
console.log("popup visible after click:", await popup.isVisible());

const linksInPanel = await popup.locator('[data-slot="navigation-menu-link"]').allTextContents();
console.log("dropdown links:", JSON.stringify(linksInPanel));

await popup.locator('[data-slot="navigation-menu-link"]', { hasText: "04 / Projects" }).click();
await page.waitForTimeout(600);
console.log("url after link click:", page.url());
console.log("popup visible after link click (should be false):", await popup.isVisible().catch(() => false));

await trigger.click();
await page.waitForTimeout(300);
console.log("popup visible after reopen:", await popup.isVisible());
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
console.log("popup visible after Escape (should be false):", await popup.isVisible().catch(() => false));

await browser.close();
