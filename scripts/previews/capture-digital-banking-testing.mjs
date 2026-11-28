// Renders scripts/previews/digital-banking-testing.html frame by frame (deterministic) into PNG files.
// Usage: node scripts/previews/capture-digital-banking-testing.mjs <outDir> [fps=24] [t1,t2,...]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const [outDir, fpsArg = '24', only] = process.argv.slice(2);
if (!outDir) throw new Error('outDir required');
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.resolve('scripts/previews/digital-banking-testing.html')).href);
const total = await page.evaluate(() => window.TOTAL);
const fps = Number(fpsArg);
const times = only ? only.split(',').map(Number) : Array.from({ length: Math.round(total * fps) }, (_, i) => i / fps);
let n = 0;
for (const t of times) {
  await page.evaluate((x) => window.render(x), t);
  await page.screenshot({ path: path.join(outDir, only ? `t${t}.png` : `f${String(n).padStart(4, '0')}.png`) });
  n++;
}
console.log(`frames: ${n}, duration: ${total}s`);
await browser.close();
