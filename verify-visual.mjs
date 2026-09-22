import { chromium } from "@playwright/test";
const browser = await chromium.launch();

const shots = [
  { width: 1920, height: 200, colorScheme: "dark", name: "full-1920-dark" },
  { width: 1920, height: 200, colorScheme: "light", name: "full-1920-light" },
  { width: 1280, height: 200, colorScheme: "dark", name: "compact-1280-dark" },
  { width: 390, height: 700, colorScheme: "dark", name: "mobile-390-dark" },
];

for (const shot of shots) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    colorScheme: shot.colorScheme,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:3002/", { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `nav-shots/${shot.name}.png`, clip: { x: 0, y: 0, width: shot.width, height: Math.min(shot.height, 400) } });
  await context.close();
}

await browser.close();
console.log("done");
