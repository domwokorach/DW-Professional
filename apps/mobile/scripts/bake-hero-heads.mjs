// Bakes the website's CSS head mask (src/styles/hero.css `.hero-head`) into the alpha channel of each head crop,
// so React Native needs no mask view. Originals in assets/images/hero are never modified; output goes to assets/images/face.
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';

const lerp = (stops, t) => {
  for (let i = 1; i < stops.length; i++) {
    const [t0, v0] = stops[i - 1];
    const [t1, v1] = stops[i];
    if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0 || 1);
  }
  return stops.at(-1)[1];
};
const vertical = [[0, 1], [0.7, 1], [0.74, 0.9], [0.8, 0.5], [0.86, 0.1], [0.9, 0], [1, 0]];
const horizontal = [[0, 0], [0.05, 0.5], [0.1, 1], [0.9, 1], [0.95, 0.5], [1, 0]];

mkdirSync('assets/images/face', { recursive: true });
for (const file of readdirSync('assets/images/hero').filter((f) => f.endsWith('.webp'))) {
  const { data, info } = await sharp(`assets/images/hero/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  for (let y = 0; y < h; y++) {
    const my = lerp(vertical, (y + 0.5) / h);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4 + 3;
      data[i] = Math.round(data[i] * my * lerp(horizontal, (x + 0.5) / w));
    }
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).webp({ lossless: true }).toFile(`assets/images/face/${file}`);
  console.log(file, w, h);
}
