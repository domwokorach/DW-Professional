// Generates the hero banners (1200x440, shown at 600x220) and feature thumbnails (128x128, shown at 64x64)
// used by the illustrative HTML email templates. Flat geometric art in the email palette, rendered at 2x so it
// stays sharp on high-density screens. Run: node scripts/email/generate-images.mjs
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const C = { bg: '#E6F1ED', g1: '#006A4D', g2: '#00432F', g3: '#7FBFA6', g4: '#BFE0D2', w: '#FFFFFF', ink: '#2B2B2B' };
const hero = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="440" viewBox="0 0 1200 440"><rect width="1200" height="440" fill="${C.bg}"/>${body}</svg>`;
const thumb = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="${C.bg}"/>${body}</svg>`;
const arch = (x, y, r, h, fill) => `<path d="M${x} ${y + h}V${y + r}A${r} ${r} 0 0 1 ${x + 2 * r} ${y + r}V${y + h}Z" fill="${fill}"/>`;

const heroes = {
  'hero-internal': hero(`
    <path d="M0 440V230A210 210 0 0 1 210 440Z" fill="${C.g4}"/><path d="M1200 0V210A210 210 0 0 1 990 0Z" fill="${C.g3}"/>
    <circle cx="500" cy="220" r="150" fill="${C.g3}"/><circle cx="640" cy="220" r="150" fill="${C.g1}" fill-opacity=".92"/><circle cx="780" cy="220" r="150" fill="${C.g2}" fill-opacity=".9"/>`),
  'hero-events': hero(`
    <circle cx="1010" cy="110" r="84" fill="${C.g3}"/><path d="M0 440V300A140 140 0 0 1 140 440Z" fill="${C.g4}"/>
    ${[0, 1, 2, 3, 4].map((c) => [0, 1, 2].map((r) => {
      const hot = (c * 3 + r) % 4 === 1; const mid = (c * 3 + r) % 5 === 3;
      return `<rect x="${330 + c * 118}" y="${56 + r * 118}" width="98" height="98" rx="20" fill="${hot ? C.g1 : mid ? C.g3 : C.w}"/>`;
    }).join('')).join('')}`),
  'hero-news': hero(`
    <path d="M0 0H220A220 220 0 0 1 0 220Z" fill="${C.g4}"/><circle cx="1050" cy="330" r="110" fill="${C.g3}"/>
    ${[150, 230, 190, 290, 210, 250, 170].map((h, i) => `<rect x="${290 + i * 90}" y="${390 - h}" width="64" height="${h}" rx="16" fill="${[C.g1, C.g3, C.g2, C.g1, C.g3, C.g2, C.g1][i]}"/>`).join('')}`),
  'hero-welcome': hero(`
    <circle cx="190" cy="120" r="70" fill="${C.g3}"/><circle cx="1030" cy="330" r="96" fill="${C.g4}"/>
    ${arch(420, 40, 180, 360, C.g2)}${arch(470, 100, 130, 300, C.g1)}${arch(520, 160, 80, 240, C.g3)}${arch(565, 215, 35, 185, C.w)}`),
};

const thumbs = {
  'thumb-internal-1': `<circle cx="52" cy="64" r="26" fill="${C.g3}"/><circle cx="76" cy="64" r="26" fill="${C.g1}" fill-opacity=".92"/>`,
  'thumb-internal-2': `<circle cx="64" cy="64" r="30" fill="none" stroke="${C.g1}" stroke-width="10"/><circle cx="64" cy="64" r="9" fill="${C.g2}"/>`,
  'thumb-internal-3': `<path d="M64 38L92 88H36Z" fill="none" stroke="${C.g3}" stroke-width="6" stroke-linejoin="round"/><circle cx="64" cy="38" r="12" fill="${C.g1}"/><circle cx="92" cy="88" r="12" fill="${C.g2}"/><circle cx="36" cy="88" r="12" fill="${C.g3}"/>`,
  'thumb-events-1': `<rect x="30" y="30" width="30" height="30" rx="8" fill="${C.g1}"/><rect x="68" y="30" width="30" height="30" rx="8" fill="${C.g3}"/><rect x="30" y="68" width="30" height="30" rx="8" fill="${C.g3}"/><rect x="68" y="68" width="30" height="30" rx="8" fill="${C.g2}"/>`,
  'thumb-events-2': `<circle cx="48" cy="52" r="16" fill="${C.g1}"/><circle cx="80" cy="52" r="16" fill="${C.g3}"/><path d="M26 98A22 22 0 0 1 70 98Z" fill="${C.g1}"/><path d="M58 98A22 22 0 0 1 102 98Z" fill="${C.g3}"/>`,
  'thumb-events-3': `<rect x="26" y="34" width="76" height="46" rx="10" fill="${C.g1}"/><rect x="50" y="90" width="28" height="8" rx="4" fill="${C.g3}"/>`,
  'thumb-news-1': `<rect x="36" y="26" width="48" height="64" rx="10" fill="${C.g3}"/><rect x="46" y="38" width="48" height="64" rx="10" fill="${C.g1}"/><rect x="56" y="54" width="28" height="6" rx="3" fill="${C.w}"/><rect x="56" y="68" width="20" height="6" rx="3" fill="${C.w}"/>`,
  'thumb-news-2': `<circle cx="64" cy="64" r="34" fill="${C.g3}"/><circle cx="64" cy="64" r="20" fill="${C.g1}"/><circle cx="64" cy="64" r="7" fill="${C.w}"/>`,
  'thumb-news-3': `<path d="M30 98V68A34 34 0 0 1 64 98Z" fill="${C.g1}"/><path d="M98 30V60A34 34 0 0 1 64 30Z" fill="${C.g3}"/><circle cx="90" cy="92" r="14" fill="${C.g2}"/>`,
  'thumb-welcome-1': `${arch(34, 26, 30, 76, C.g1)}${arch(48, 50, 16, 52, C.g3)}`,
  'thumb-welcome-2': `<circle cx="64" cy="48" r="18" fill="${C.g1}"/><path d="M28 102A36 36 0 0 1 100 102Z" fill="${C.g3}"/>`,
  'thumb-welcome-3': `${[0, 1, 2].map((i) => `<circle cx="38" cy="${40 + i * 24}" r="7" fill="${[C.g1, C.g3, C.g2][i]}"/><rect x="54" y="${35 + i * 24}" width="${[40, 34, 28][i]}" height="10" rx="5" fill="${[C.g1, C.g3, C.g2][i]}"/>`).join('')}`,
};

mkdirSync('public/email', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
const render = async (name, svg, w, h) => {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  const out = await sharp(png).png({ palette: true, quality: 95, effort: 10 }).toBuffer();
  writeFileSync(`public/email/${name}.png`, out);
  console.log(name, w + 'x' + h, out.length + ' bytes');
};
for (const [n, s] of Object.entries(heroes)) await render(n, s, 1200, 440);
for (const [n, body] of Object.entries(thumbs)) await render(n, thumb(body), 128, 128);
await browser.close();
