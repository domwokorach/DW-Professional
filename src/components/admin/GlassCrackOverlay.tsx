'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  /** Impact point in viewport (CSS) pixels. */
  x: number;
  y: number;
  onDone: () => void;
};

/** kind 0 micro/twig, 1 secondary/web, 2 primary, 3 thick root of a primary. */
type Crack = { pts: number[]; cum: number[]; len: number; t0: number; t1: number; kind: 0 | 1 | 2 | 3; faint: boolean; d: number };
type Cell = { pts: number[]; t: number; tone: number; alpha: number; phase: number };
type Glint = { crack: Crack; at: number; size: number; phase: number };

// Stage timings (ms): impact, primary fractures, secondary fractures, micro-fractures, reflections, dissolve.
const IMPACT = 80;
const PRIMARY_END = 250;
const SECONDARY_END = 550;
const MICRO_END = 800;
const SHIMMER_END = 1200;
const TOTAL = 2000;

const WIDTH = [0.45, 0.8, 1.25, 1.9];
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A jagged polyline that wanders off its heading, like a fracture running through glass. */
function makeCrack(rand: () => number, x: number, y: number, angle: number, length: number, step: number, kind: Crack['kind'], t0: number, t1: number, faint = false): Crack {
  const pts = [x, y];
  const cum = [0];
  let travelled = 0;
  let a = angle;
  while (travelled < length) {
    const s = step * (0.6 + rand() * 1.1);
    a += (rand() + rand() - 1) * 0.1 + (rand() < 0.14 ? (rand() - 0.5) * 0.55 : 0); // near-straight runs with sharp kinks
    x += Math.cos(a) * s;
    y += Math.sin(a) * s;
    travelled += s;
    pts.push(x, y);
    cum.push(travelled);
  }
  return { pts, cum, len: travelled, t0, t1, kind, faint, d: 0 };
}

/** Point at distance `d` along a crack (clamped to its end), with the local heading. */
function pointAt(c: Crack, d: number): [number, number, number] {
  let i = 1;
  while (i < c.cum.length - 1 && c.cum[i] < d) i++;
  const span = c.cum[i] - c.cum[i - 1] || 1;
  const t = clamp01((d - c.cum[i - 1]) / span);
  const x0 = c.pts[(i - 1) * 2], y0 = c.pts[(i - 1) * 2 + 1];
  const x1 = c.pts[i * 2], y1 = c.pts[i * 2 + 1];
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, Math.atan2(y1 - y0, x1 - x0)];
}

/** The first `frac` of a crack as its own crack (the thick root of a primary fracture). */
function head(c: Crack, frac: number, kind: Crack['kind']): Crack {
  const d = c.len * frac;
  let n = 1;
  while (n < c.cum.length - 1 && c.cum[n] < d) n++;
  const pts = c.pts.slice(0, (n + 1) * 2);
  const cum = c.cum.slice(0, n + 1);
  return { pts, cum, len: cum[n], t0: c.t0, t1: lerp(c.t0, c.t1, frac), kind, faint: false, d: 0 };
}

function build(w: number, h: number, ox: number, oy: number, light: boolean) {
  const rand = mulberry32((Math.random() * 2 ** 32) >>> 0);
  const diag = Math.hypot(w, h);
  const step = Math.max(10, diag / 50);
  const rays = light ? 12 : 12 + Math.floor(rand() * 9); // 12–20 primary fractures
  const cracks: Crack[] = [];
  const glints: Glint[] = [];

  // Primaries: irregular spacing, uneven reach. Speed is constant, so longer cracks arrive later.
  const offset = rand() * Math.PI * 2;
  const lengths = Array.from({ length: rays }, () => diag * (0.4 + rand() * 0.75));
  const maxLen = Math.max(...lengths);
  const primaries: Crack[] = [];
  for (let i = 0; i < rays; i++) {
    const angle = offset + ((i + (rand() - 0.5) * 0.7) / rays) * Math.PI * 2;
    const t1 = IMPACT + (PRIMARY_END - IMPACT) * clamp01(lengths[i] / maxLen) * (0.92 + rand() * 0.08);
    const c = makeCrack(rand, ox, oy, angle, lengths[i], step, 2, IMPACT, Math.max(IMPACT + 60, t1));
    primaries.push(c);
    cracks.push(c, head(c, 0.3 + rand() * 0.15, 3));
  }

  // Secondary fractures: acute branches leaning away from the impact, each born when its parent reaches it.
  const branches: Crack[] = [];
  for (const p of primaries) {
    const count = (light ? 2 : 3) + Math.floor(rand() * 4);
    for (let b = 0; b < count; b++) {
      const f = 0.07 + rand() * 0.8;
      const [bx, by, ba] = pointAt(p, p.len * f);
      const side = rand() < 0.5 ? -1 : 1;
      const born = lerp(p.t0, p.t1, f);
      const t0 = Math.max(born + 15, 220 + rand() * 140);
      const c = makeCrack(rand, bx, by, ba + side * (0.28 + rand() * 0.6), p.len * (0.07 + rand() * 0.22) * (1.1 - f * 0.6), step * 0.8, 1, t0, Math.min(SECONDARY_END + 20, t0 + 110 + rand() * 150), rand() < 0.35);
      cracks.push(c);
      branches.push(c);
      // Twigs off the branches (finer, later).
      const twigs = light ? 0 : Math.floor(rand() * 3);
      for (let k = 0; k < twigs; k++) {
        const tf = 0.2 + rand() * 0.65;
        const [tx, ty, ta] = pointAt(c, c.len * tf);
        const tt0 = lerp(c.t0, c.t1, tf) + 10;
        cracks.push(makeCrack(rand, tx, ty, ta - side * (0.3 + rand() * 0.7), c.len * (0.2 + rand() * 0.35), step * 0.6, 0, tt0, Math.min(SECONDARY_END + 60, tt0 + 90), true));
      }
    }
  }

  // Polygonal spiderweb: chords between neighbouring rays at widening radii (with the facets they enclose).
  const radii = light ? [0.04, 0.1, 0.2, 0.36] : [0.03, 0.06, 0.1, 0.16, 0.25, 0.38, 0.55];
  const sorted = [...primaries].sort((a, b) => Math.atan2(a.pts[3] - a.pts[1], a.pts[2] - a.pts[0]) - Math.atan2(b.pts[3] - b.pts[1], b.pts[2] - b.pts[0]));
  const rings: ([number, number] | null)[][] = [];
  const cells: Cell[] = [];
  radii.forEach((rf, ri) => {
    const d = diag * rf;
    const row: ([number, number] | null)[] = sorted.map((p) => (d < p.len ? ([...pointAt(p, d * (0.95 + rand() * 0.1))].slice(0, 2) as [number, number]) : null));
    rings.push(row);
    const t0 = 170 + (ri / radii.length) * 330;
    for (let i = 0; i < row.length; i++) {
      const a = row[i], b = row[(i + 1) % row.length];
      if (!a || !b || rand() < 0.14) continue; // real webs are incomplete
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len > diag * 0.5) continue;
      const pts = [a[0], a[1]];
      const cum = [0];
      const parts = 2 + Math.floor(rand() * 3);
      for (let k = 1; k <= parts; k++) {
        const t = k / parts;
        const jitter = k === parts ? 0 : (rand() - 0.5) * len * 0.2;
        pts.push(lerp(a[0], b[0], t) - ((b[1] - a[1]) / (len || 1)) * jitter, lerp(a[1], b[1], t) + ((b[0] - a[0]) / (len || 1)) * jitter);
        cum.push(len * t);
      }
      cracks.push({ pts, cum, len, t0, t1: t0 + 90 + rand() * 50, kind: 1, faint: rand() < 0.15, d: 0 });
    }
  });
  // Facets between the first rings (and the central wedge): faint fills that catch the light as the glass settles.
  const bands = Math.min(3, rings.length - 1);
  for (let i = 0; i < sorted.length; i++) {
    const j = (i + 1) % sorted.length;
    const first = [rings[0][i], rings[0][j]];
    if (first[0] && first[1]) cells.push({ pts: [ox, oy, ...first[0], ...first[1]], t: 170 + 60, tone: rand() * 2 - 1, alpha: 0.04 + rand() * 0.06, phase: rand() * 6.28 });
    for (let r = 0; r < bands; r++) {
      const a = rings[r][i], b = rings[r][j], c = rings[r + 1][j], dd = rings[r + 1][i];
      if (!a || !b || !c || !dd || rand() < 0.2) continue;
      cells.push({ pts: [...a, ...b, ...c, ...dd], t: 170 + ((r + 1) / radii.length) * 330 + 90, tone: rand() * 2 - 1, alpha: 0.025 + rand() * 0.055, phase: rand() * 6.28 });
    }
  }

  // Micro-fractures: hairline splinters crowding the impact.
  const splinters = light ? 30 : 90;
  for (let i = 0; i < splinters; i++) {
    const p = primaries[Math.floor(rand() * primaries.length)];
    const [bx, by, ba] = pointAt(p, diag * (0.004 + rand() * 0.14));
    const t0 = SECONDARY_END + rand() * 170;
    cracks.push(makeCrack(rand, bx, by, ba + (rand() - 0.5) * 2.6, diag * (0.006 + rand() * 0.03), step * 0.4, 0, t0, t0 + 50 + rand() * 70, true));
  }

  // Specular points for the reflection stage.
  const hosts = cracks.filter((c) => c.kind >= 1 && c.len > diag * 0.04);
  const glintCount = light ? 16 : 40;
  for (let i = 0; i < glintCount && hosts.length; i++) {
    glints.push({ crack: hosts[Math.floor(rand() * hosts.length)], at: 0.1 + rand() * 0.85, size: 4 + rand() * 8, phase: rand() * 6.28 });
  }
  return { cracks, cells, glints, diag };
}

/** Traces the first `d` px of a crack into the current path. */
function trace(ctx: CanvasRenderingContext2D, c: Crack, d: number) {
  ctx.moveTo(c.pts[0], c.pts[1]);
  for (let i = 1; i < c.cum.length; i++) {
    if (c.cum[i] <= d) { ctx.lineTo(c.pts[i * 2], c.pts[i * 2 + 1]); continue; }
    const t = (d - c.cum[i - 1]) / (c.cum[i] - c.cum[i - 1] || 1);
    if (t > 0) ctx.lineTo(lerp(c.pts[(i - 1) * 2], c.pts[i * 2], t), lerp(c.pts[(i - 1) * 2 + 1], c.pts[i * 2 + 1], t));
    break;
  }
}

/**
 * Cracked-glass effect that plays once over the whole viewport (about 2 s), radiating from the impact point.
 * Layers, back to front: glare + shockwave, facets, refraction glow, shadowed edges, chromatic fringes, silver
 * cores, specular glints and a travelling shimmer. Decorative only: pointer-events are off and it is hidden from
 * assistive tech. Remount it (change its key) to replay; the previous run is cancelled on unmount. The caller
 * should not render it for reduced-motion users.
 */
export default function GlassCrackOverlay({ x, y, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) { done.current(); return; }

    const nav = navigator as Navigator & { deviceMemory?: number };
    const light = (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4;
    const dark = document.documentElement.dataset.theme === 'dark';
    const dpr = Math.min(window.devicePixelRatio || 1, light ? 1.5 : 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const { cracks, cells, glints, diag } = build(w, h, x, y, light);
    // Cracks grouped by kind and visibility so each pass is a handful of strokes, not hundreds.
    const buckets: Crack[][] = Array.from({ length: 8 }, () => []);
    for (const c of cracks) buckets[c.kind * 2 + (c.faint ? 1 : 0)].push(c);
    const start = performance.now();
    let frame = 0;

    const finish = () => { cancelAnimationFrame(frame); done.current(); };
    // A resize or rotation would leave the cracks in the wrong place; end the one-off effect instead.
    window.addEventListener('resize', finish, { once: true });

    const shadow = dark ? 'rgba(0,0,10,' : 'rgba(40,48,96,';
    const facet = dark ? [210, 222, 255] : [255, 255, 255];

    const draw = (now: number) => {
      const t = now - start;
      if (t >= TOTAL) { finish(); return; }

      // A brief tremor of the glass itself (never the page): a decaying jitter of the drawing.
      const amp = t < 260 ? 1.8 * (1 - t / 260) ** 2 : 0;
      ctx.setTransform(dpr, 0, 0, dpr, Math.sin(t / 13) * amp * dpr, Math.cos(t / 9) * amp * dpr);
      ctx.clearRect(-4, -4, w + 8, h + 8);

      const dissolve = clamp01((t - SHIMMER_END) / (TOTAL - SHIMMER_END));
      // Fine fractures vanish first, the primaries last.
      const kindFade = [1 - clamp01(dissolve * 2.3), 1 - clamp01(dissolve * 1.7 - 0.1), 1 - clamp01(dissolve * 1.25 - 0.05), 1 - clamp01(dissolve * 1.25 - 0.05)];
      const all = 1 - easeOut(dissolve);

      for (const c of cracks) c.d = c.len * easeOut(clamp01((t - c.t0) / (c.t1 - c.t0)));

      // Glare around the impact and the shockwave ring.
      const glare = clamp01(1 - t / 700) * (0.4 + 0.6 * clamp01(t / IMPACT));
      if (glare > 0) {
        const r = diag * 0.3;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,255,255,${0.2 * glare})`);
        g.addColorStop(0.15, `rgba(180,195,255,${0.1 * glare})`);
        g.addColorStop(1, 'rgba(160,170,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      if (t < 480) {
        const p = easeOut(t / 480);
        const a = (1 - t / 480) ** 1.6;
        ctx.lineWidth = 0.6 + 2.2 * (1 - p);
        ctx.strokeStyle = `rgba(235,240,255,${0.55 * a})`;
        ctx.beginPath(); ctx.arc(x, y, diag * 0.22 * p + 6, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = `rgba(170,150,255,${0.35 * a})`;
        ctx.beginPath(); ctx.arc(x, y, diag * 0.18 * p + 3, 0, Math.PI * 2); ctx.stroke();
      }
      if (t < IMPACT * 3) {
        const f = 1 - clamp01((t - IMPACT) / (IMPACT * 2));
        const r = 10 + diag * 0.03 * easeOut(clamp01(t / IMPACT));
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,255,255,${0.95 * f})`);
        g.addColorStop(0.5, `rgba(200,210,255,${0.4 * f})`);
        g.addColorStop(1, 'rgba(180,170,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }

      // Facets: irregular fragments that tilt and catch the light once the glass settles.
      const settle = clamp01((t - MICRO_END) / (SHIMMER_END - MICRO_END));
      for (const c of cells) {
        const born = clamp01((t - c.t) / 80);
        if (born <= 0) continue;
        const glint = settle > 0 ? 0.5 + 0.5 * Math.sin(c.phase + t / 150) : 0;
        const a = c.alpha * born * (1 + 1.6 * glint * Math.sin(settle * Math.PI)) * all * (dark ? 1 : 0.5);
        ctx.fillStyle = c.tone > 0 ? `rgba(${facet[0]},${facet[1]},${facet[2]},${a})` : `rgba(130,140,235,${a * 1.1})`;
        ctx.beginPath();
        ctx.moveTo(c.pts[0], c.pts[1]);
        for (let k = 2; k < c.pts.length; k += 2) ctx.lineTo(c.pts[k], c.pts[k + 1]);
        ctx.closePath();
        ctx.fill();
      }

      const pass = (style: string, scale: number, alpha: number, kinds: number[], dx = 0, dy = 0) => {
        for (const k of kinds) {
          for (let j = 0; j < 2; j++) {
            const list = buckets[k * 2 + j];
            if (!list.length) continue;
            const a = alpha * kindFade[k] * (j ? 0.5 : 1);
            if (a <= 0.003) continue;
            ctx.beginPath();
            for (const c of list) if (c.d > 0) trace(ctx, c, c.d);
            ctx.strokeStyle = style.replace('A', a.toFixed(3));
            ctx.lineWidth = WIDTH[k] * scale;
            ctx.save();
            ctx.translate(dx, dy);
            ctx.stroke();
            ctx.restore();
          }
        }
      };

      // Refraction glow around the strongest fractures, then the soft shadow each edge casts.
      if (!light && dark) pass('rgba(130,150,255,A)', 3.4, 0.14, [2, 3, 1]);
      pass(`${shadow}A)`, dark ? 1.5 : 1.25, dark ? 0.4 : 0.55, [0, 1, 2, 3], 0.9, 1.1);
      // Chromatic dispersion fringes beside the major cracks.
      if (!light) {
        pass('rgba(255,95,130,A)', 0.7, 0.3, [2, 3], -0.7, 0);
        pass('rgba(80,200,255,A)', 0.7, 0.34, [2, 3], 0.7, 0);
      }
      // Thin silver-white cores: the lit edge of each fracture.
      pass('rgba(246,249,255,A)', 1, 0.94, [0, 1, 2, 3]);

      // Specular glints: tiny stars on a few cracks, twinkling during the reflection stage.
      if (t >= MICRO_END) {
        const gl = clamp01((t - MICRO_END) / 120) * (1 - clamp01((t - SHIMMER_END) / 300)) * all;
        for (const s of glints) {
          const pulse = Math.max(0, Math.sin(s.phase + t / 120)) ** 3;
          if (pulse <= 0.05 || s.crack.d < s.crack.len * s.at) continue;
          const [gx, gy] = pointAt(s.crack, s.crack.len * s.at);
          const r = s.size * (0.6 + pulse);
          const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
          g.addColorStop(0, `rgba(255,255,255,${0.95 * pulse * gl})`);
          g.addColorStop(0.35, `rgba(170,175,255,${0.5 * pulse * gl})`);
          g.addColorStop(1, 'rgba(150,120,255,0)');
          ctx.fillStyle = g;
          ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
          ctx.strokeStyle = `rgba(255,255,255,${0.7 * pulse * gl})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(gx - r * 1.6, gy); ctx.lineTo(gx + r * 1.6, gy);
          ctx.moveTo(gx, gy - r * 1.6); ctx.lineTo(gx, gy + r * 1.6);
          ctx.stroke();
        }
      }

      // Shimmer: a blue → violet → white band sweeps across the fractures and lights them as it passes.
      if (t >= MICRO_END - 60 && t < TOTAL) {
        const p = clamp01((t - (MICRO_END - 60)) / (SHIMMER_END - MICRO_END + 380));
        const cx = -0.3 * w + p * 1.6 * w;
        const g = ctx.createLinearGradient(cx - w * 0.22, 0, cx + w * 0.22, h * 0.45);
        g.addColorStop(0, 'rgba(120,150,255,0)');
        g.addColorStop(0.35, 'rgba(120,160,255,0.45)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.65, 'rgba(190,130,255,0.5)');
        g.addColorStop(1, 'rgba(170,120,255,0)');
        ctx.globalAlpha = Math.min(all, 1 - clamp01((t - SHIMMER_END) / 400));
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (const c of cracks) if (c.kind >= 1) trace(ctx, c, c.len);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', finish);
      canvas.width = canvas.height = 0; // release the bitmap
    };
  }, [x, y]);

  // Portalled to <body> so no transformed ancestor can offset its fixed positioning.
  return createPortal(<canvas ref={canvasRef} className="adm-glass" aria-hidden="true" />, document.body);
}
