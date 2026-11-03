'use client';

import { useEffect, useRef } from 'react';

type Layer = { count: number; size: [number, number]; speed: [number, number]; alpha: [number, number]; sway: [number, number]; glow: boolean };
type Flake = { x: number; y: number; r: number; vy: number; alpha: number; amp: number; freq: number; phase: number; layer: number };

// Far to near: smaller, slower and fainter flakes sit behind larger, faster ones. Sizes are diameters in px.
const LAYERS: Layer[] = [
  { count: 0.5, size: [2, 4], speed: [18, 30], alpha: [0.55, 0.8], sway: [4, 10], glow: false },
  { count: 0.33, size: [4, 6], speed: [32, 50], alpha: [0.7, 0.9], sway: [8, 18], glow: false },
  { count: 0.17, size: [6, 8], speed: [52, 78], alpha: [0.85, 1], sway: [14, 28], glow: true },
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Pre-renders one flake so the frame loop only needs drawImage (no per-frame gradients or shadow blur).
 *  A white core reads as snow on any background; on light themes a soft cool-grey rim keeps it visible. */
function makeSprite(dark: boolean, glow: boolean) {
  const s = 64, m = s / 2;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const halo = g.createRadialGradient(m, m, 0, m, m, m);
  const rim = dark ? '255,255,255' : '110,140,185';
  halo.addColorStop(0, `rgba(${rim},${glow ? 0.7 : 0.55})`);
  halo.addColorStop(0.3, `rgba(${rim},${dark ? 0.25 : 0.4})`);
  halo.addColorStop(1, `rgba(${rim},0)`);
  g.fillStyle = halo;
  g.fillRect(0, 0, s, s);
  const core = g.createRadialGradient(m, m, 0, m, m, m * 0.34);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.8, 'rgba(255,255,255,0.95)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = core;
  g.fillRect(0, 0, s, s);
  return c;
}

/** Seasonal snowfall. Remove this component (and its import in app/layout.tsx) to retire it. */
export default function SnowfallLayer() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0, wind = 0, windT = 0;
    let flakes: Flake[] = [];
    let sprites: HTMLCanvasElement[] = [];

    const buildSprites = () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      sprites = LAYERS.map((l) => makeSprite(dark, l.glow));
    };

    const spawn = (layer: number, anywhere: boolean): Flake => {
      const l = LAYERS[layer];
      return {
        x: rand(0, w), y: anywhere ? rand(0, h) : rand(-20, -4), layer,
        r: rand(l.size[0], l.size[1]) / 2, vy: rand(...l.speed), alpha: rand(...l.alpha),
        amp: rand(...l.sway), freq: rand(0.25, 0.7), phase: rand(0, Math.PI * 2),
      };
    };

    const build = () => {
      w = window.innerWidth; h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const total = w < 640 ? 55 : w < 1024 ? 85 : 140;
      flakes = LAYERS.flatMap((l, i) => Array.from({ length: Math.round(total * l.count) }, () => spawn(i, true)));
    };

    const frame = (now: number) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      windT += dt;
      wind = Math.sin(windT * 0.15) * 12 + Math.sin(windT * 0.37) * 5; // gentle, slowly changing breeze (px/s)
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.vy * dt;
        const drift = Math.sin(windT * f.freq + f.phase) * f.amp;
        f.x += (wind * (0.5 + f.layer * 0.4) + drift * 0.6) * dt;
        if (f.y > h + f.r * 4) Object.assign(f, spawn(f.layer, false)); // regenerate above the viewport
        if (f.x < -20) f.x = w + 20; else if (f.x > w + 20) f.x = -20;
        const d = f.r * 2.9; // sprite half-size; the white core is ~34% of it, i.e. the flake's nominal diameter
        ctx.globalAlpha = f.alpha;
        ctx.drawImage(sprites[f.layer], f.x - d, f.y - d, d * 2, d * 2);
      }
      raf = requestAnimationFrame(frame);
    };

    const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0; };
    const start = () => {
      if (raf || reduce.matches || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      stop();
      ctx.clearRect(0, 0, w, h);
      start();
    };

    buildSprites();
    build();
    start();

    const onResize = () => { build(); };
    const themeObserver = new MutationObserver(buildSprites);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener('change', sync);
    return () => {
      stop();
      themeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', sync);
      reduce.removeEventListener('change', sync);
    };
  }, []);

  return <canvas ref={ref} className="xm-snow" aria-hidden="true" />;
}
