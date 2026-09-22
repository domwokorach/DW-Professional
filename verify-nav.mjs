import { chromium } from "@playwright/test";

const BASE = "http://localhost:3002";
const widths = [375, 768, 1024, 1279, 1280, 1535, 1536, 1920];
const results = [];

const browser = await chromium.launch();

function isVisible(el) {
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(300);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  const visibleLabels = await page.evaluate((isVisibleFn) => {
    const fn = new Function("el", `${isVisibleFn}; return isVisible(el);`);
    const nodes = Array.from(document.querySelectorAll("header nav *")).filter(
      (el) => el.children.length === 0 && el.textContent?.trim() && fn(el)
    );
    return nodes.map((n) => n.textContent.trim());
  }, isVisible.toString());

  const hamburgerVisible = await page.locator('header button[aria-controls="mobile-menu"]').isVisible().catch(() => false);
  const compactTriggerVisible = await page
    .locator("header")
    .getByRole("button", { name: /open navigation menu|close navigation menu|menu/i, exact: false })
    .first()
    .isVisible()
    .catch(() => false);

  const screenshotPath = `/Users/dominicolanya/Developer/dw-test-developer/nav-shots/header-${width}.png`;
  await page.locator("header").screenshot({ path: screenshotPath }).catch(() => {});

  results.push({
    width,
    overflowX: overflow.scrollWidth > overflow.clientWidth + 1,
    hamburgerVisible,
    visibleLabels,
    consoleErrors,
  });

  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
