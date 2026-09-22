import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const report = {};

const browser = await chromium.launch();

function isVisible(el) {
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

// --- 1. Desktop: nav items, order, no numbers, links work, resume, language ---
async function testDesktop() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto(BASE + "/en-gb", { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(500);

  const navLinks = await page.locator('header nav [data-slot="navigation-menu-link"]').allTextContents();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

  // language selector
  const langTrigger = page.locator('header [data-slot="select-trigger"]').first();
  const langLabelBefore = (await langTrigger.textContent())?.trim();
  await langTrigger.click();
  await page.waitForTimeout(300);
  const langPopupVisible = await page.locator('[data-slot="select-content"]').first().isVisible().catch(() => false);
  const langItems = await page.locator('[data-slot="select-item"]').allTextContents();
  // pick French
  const frItem = page.locator('[data-slot="select-item"]', { hasText: "Français" });
  await frItem.click();
  await page.waitForTimeout(600);
  const langLabelAfter = (await langTrigger.textContent())?.trim();
  const urlAfterLang = page.url();

  // switch back to English (UK) for subsequent tests
  await langTrigger.click();
  await page.waitForTimeout(300);
  await page.locator('[data-slot="select-item"]', { hasText: "English (UK)" }).click();
  await page.waitForTimeout(500);

  // click Services link
  const servicesLink = page.locator('header nav [data-slot="navigation-menu-link"]', { hasText: "Services" });
  await servicesLink.click();
  await page.waitForTimeout(700);
  const urlAfterServices = page.url();
  const servicesInView = await page.evaluate(() => {
    const el = document.getElementById("services");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });

  // Resume button
  const resumeBtn = page.locator("header").getByRole("button", { name: "Resume", exact: true });
  const resumeVisible = await resumeBtn.isVisible();
  await resumeBtn.click();
  await page.waitForTimeout(400);
  const modalVisible = await page.locator('[role="dialog"]').first().isVisible().catch(() => false);
  await page.keyboard.press("Escape");

  // Keyboard nav: tab into nav
  await page.keyboard.press("Tab");

  await page.locator("header").screenshot({ path: "/tmp/nav-desktop.png" }).catch(() => {});

  report.desktop = {
    navLinks,
    overflow,
    langLabelBefore,
    langPopupVisible,
    langItemsCount: langItems.length,
    langLabelAfter,
    urlAfterLang,
    urlAfterServices,
    servicesInView,
    resumeVisible,
    modalVisible,
    errors,
  };

  await context.close();
}

// --- 2. Tablet portrait 768 ---
async function testTablet() {
  const context = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + "/en-gb", { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(500);

  const hamburgerVisible = await page.locator('header button[aria-controls="mobile-menu"]').isVisible();
  const desktopNavVisible = await page.locator('header nav [data-slot="navigation-menu-link"]').first().isVisible().catch(() => false);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

  await page.locator('header button[aria-controls="mobile-menu"]').click();
  await page.waitForTimeout(500);
  const panel = page.locator("#mobile-menu");
  const panelVisible = await panel.isVisible();
  const itemTexts = await panel.locator("li").allTextContents();
  await page.locator("header").screenshot({ path: "/tmp/nav-tablet-open.png" }).catch(() => {});

  report.tablet = { hamburgerVisible, desktopNavVisible, overflow, panelVisible, itemTexts, errors };
  await context.close();
}

// --- 3. Mobile 390, language selector inside menu, close-on-link-click ---
async function testMobile() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + "/en-gb", { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(500);

  await page.locator('header button[aria-controls="mobile-menu"]').click();
  await page.waitForTimeout(500);
  const panel = page.locator("#mobile-menu");

  // click language selector inside the mobile menu - menu should stay open
  const langTrigger = panel.locator('[data-slot="select-trigger"]');
  await langTrigger.click();
  await page.waitForTimeout(400);
  const menuStillOpenAfterLangOpen = await panel.isVisible();
  const langPopupVisible = await page.locator('[data-slot="select-content"]').first().isVisible().catch(() => false);
  await page.locator('[data-slot="select-item"]', { hasText: "Deutsch" }).click();
  await page.waitForTimeout(600);
  const menuStillOpenAfterLangSelect = await panel.isVisible();
  const langLabel = (await langTrigger.textContent())?.trim();

  // reset back to English for cleanliness
  await langTrigger.click();
  await page.waitForTimeout(400);
  await page.locator('[data-slot="select-item"]', { hasText: "English (UK)" }).click();
  await page.waitForTimeout(500);

  // section link closes menu
  await page.locator('header button[aria-controls="mobile-menu"]').click();
  await page.waitForTimeout(500);
  await panel.locator("li button", { hasText: "Gallery" }).click();
  await page.waitForTimeout(700);
  const menuClosedAfterLinkClick = await panel.isVisible().catch(() => false);
  const urlAfterGallery = page.url();

  // Resume closes menu too
  await page.locator('header button[aria-controls="mobile-menu"]').click();
  await page.waitForTimeout(500);
  await panel.locator("li button", { hasText: "Resume" }).click();
  await page.waitForTimeout(400);
  const menuClosedAfterResume = await panel.isVisible().catch(() => false);
  const modalVisibleMobile = await page.locator('[role="dialog"]').first().isVisible().catch(() => false);
  await page.keyboard.press("Escape");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  await page.locator("header").screenshot({ path: "/tmp/nav-mobile-open.png" }).catch(() => {});

  report.mobile = {
    menuStillOpenAfterLangOpen,
    langPopupVisible,
    menuStillOpenAfterLangSelect,
    langLabel,
    menuClosedAfterLinkClick,
    urlAfterGallery,
    menuClosedAfterResume,
    modalVisibleMobile,
    overflow,
    errors,
  };
  await context.close();
}

// --- 4. Keyboard: Enter to select, Escape to close, on desktop language select ---
async function testKeyboard() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE + "/en-gb", { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(500);

  const langTrigger = page.locator('header [data-slot="select-trigger"]').first();
  await langTrigger.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const openAfterEnter = await page.locator('[data-slot="select-content"]').first().isVisible().catch(() => false);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const closedAfterEscape = !(await page.locator('[data-slot="select-content"]').first().isVisible().catch(() => false));

  report.keyboard = { openAfterEnter, closedAfterEscape };
  await context.close();
}

// --- 5. Light mode contrast/visibility check ---
async function testLight() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  const page = await context.newPage();
  await page.goto(BASE + "/en-gb", { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(600);
  await page.locator("header").screenshot({ path: "/tmp/nav-desktop-light.png" }).catch(() => {});
  report.light = { screenshot: "/tmp/nav-desktop-light.png" };
  await context.close();
}

await testDesktop();
await testTablet();
await testMobile();
await testKeyboard();
await testLight();

await browser.close();
console.log(JSON.stringify(report, null, 2));
