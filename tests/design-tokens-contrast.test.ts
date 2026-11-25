import assert from 'node:assert/strict';
import test from 'node:test';
import { darkTokens, lightTokens } from '../src/styles/tokens.generated';

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const hex6 = (v: string) => (v.length === 4 ? `#${[...v.slice(1)].map((c) => c + c).join('')}` : v);

/** [foreground token, background token, minimum ratio]: 4.5 for body text, 3 for large text and UI. */
const PAIRS: [string, string, number][] = [
  ['ink', 'cream', 4.5], ['ink', 'cream2', 4.5], ['ink2', 'cream', 4.5],
  ['text-2', 'cream', 4.5], ['text-2', 'cream2', 4.5], ['text-3', 'cream', 4.5], ['text-4', 'cream', 4.5], ['muted', 'cream', 4.5], ['muted', 'cream2', 4.5],
  ['on-ink', 'ink', 4.5], ['on-gold', 'gold', 4.5], ['gold-ink', 'cream', 4.5], ['gold-ink', 'cream2', 4.5],
  ['live', 'cream', 3], ['gold', 'cream', 1.5],
];

for (const [name, t] of [['light', lightTokens], ['dark', darkTokens]] as const) {
  test(`${name} theme token pairs meet WCAG contrast`, () => {
    const tokens = t as Record<string, string>;
    const failures = PAIRS.filter(([f, b, min]) => contrast(hex6(tokens[f]), hex6(tokens[b])) < min)
      .map(([f, b, min]) => `${f} on ${b}: ${contrast(hex6(tokens[f]), hex6(tokens[b])).toFixed(2)} < ${min}`);
    assert.deepEqual(failures, []);
  });
}
