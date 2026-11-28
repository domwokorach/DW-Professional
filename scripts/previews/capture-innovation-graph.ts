// Renders scripts/previews/innovation-graph.html frame by frame from the real dataset and layout.
// Usage: npx tsx scripts/previews/capture-innovation-graph.ts <outDir> [fps=24] [t1,t2,...]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CATEGORY_META, GRAPH_LINKS, GRAPH_NODES } from '../../src/components/experience/innovation-graph/graph-data';
import layout from '../../src/components/experience/innovation-graph/graph-layout.json';

const [outDir, fpsArg = '24', only] = process.argv.slice(2);
if (!outDir) throw new Error('outDir required');
mkdirSync(outDir, { recursive: true });
const data = {
  nodes: GRAPH_NODES.map((n) => ({ id: n.id, name: n.name, category: n.category, colour: CATEGORY_META[n.category].colour, radius: CATEGORY_META[n.category].radius })),
  links: GRAPH_LINKS,
  positions: layout.positions,
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.addInitScript((d) => { (window as unknown as { GRAPH: unknown }).GRAPH = d; }, data);
await page.goto(pathToFileURL(path.resolve('scripts/previews/innovation-graph.html')).href);
const total = await page.evaluate(() => (window as unknown as { TOTAL: number }).TOTAL);
const fps = Number(fpsArg);
const times = only ? only.split(',').map(Number) : Array.from({ length: Math.round(total * fps) }, (_, i) => i / fps);
let n = 0;
for (const t of times) {
  await page.evaluate((x) => (window as unknown as { render: (t: number) => void }).render(x), t);
  await page.screenshot({ path: path.join(outDir, only ? `t${t}.png` : `f${String(n).padStart(4, '0')}.png`) });
  n++;
}
console.log(`frames: ${n}, duration: ${total}s`);
await browser.close();
