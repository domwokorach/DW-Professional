import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (err) => console.log("ERR:", err.message));
await page.goto("http://localhost:3000/en-gb/privacy", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector('button[aria-label="Toggle theme"]:not([disabled])');

async function state() {
  return page.evaluate(() => ({
    dataTheme: document.documentElement.getAttribute("data-theme"),
    darkClass: document.documentElement.classList.contains("dark"),
    localStorageTheme: localStorage.getItem("theme"),
    vtActive: document.documentElement.dataset.magicuiThemeVt,
  }));
}

console.log("initial:", await state());
await page.click('button[aria-label="Toggle theme"]:not([disabled])');
await page.waitForTimeout(200);
console.log("mid transition:", await state());
await page.waitForTimeout(800);
console.log("after 1st click settle:", await state());
await browser.close();
