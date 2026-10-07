'use client';

import dynamic from 'next/dynamic';
import { type ComponentProps, useEffect, useState } from 'react';

// three.js stays out of the initial bundle and never runs on the server.
const PhotonBeam = dynamic(() => import('@/components/ui/photon-beam'), { ssr: false });

type Tier = 'desktop' | 'tablet' | 'mobile';

/*
 * PhotonBeam paints an opaque `colorBg` with additive light. The wrapper renders
 * it on black, then `filter: invert(1)` + `mix-blend-mode: multiply` (hero.css)
 * turn black into "transparent" over the cream hero and light into ink.
 * Colours below are therefore the complements of what appears on screen:
 *   #EFE4D2 → navy #101B2D · #DA9C14 → blue #2563EB · #F76E4D → cyan #0891B2
 */
const COLORS = {
  colorBg: '#000000',
  colorLine: '#EFE4D2',
  colorSignal: '#DA9C14',
  useColor2: true,
  colorSignal2: '#F76E4D',
};

const TIERS: Record<Tier, ComponentProps<typeof PhotonBeam>> = {
  desktop: { lineCount: 26, signalCount: 12, lineOpacity: 0.09, trailLength: 90, speedGlobal: 0.3, waveSpeed: 0.9, waveHeight: 0.35, bloomStrength: 0.55, bloomRadius: 0.35 },
  tablet: { lineCount: 20, signalCount: 9, lineOpacity: 0.08, trailLength: 80, speedGlobal: 0.3, waveSpeed: 0.9, waveHeight: 0.3, bloomStrength: 0.45, bloomRadius: 0.3 },
  // Phones render (and bloom) at up to 1.5x rather than 2x: the soft, blended lines look the same, at about half the pixels.
  mobile: { lineCount: 12, signalCount: 5, lineOpacity: 0.1, trailLength: 70, speedGlobal: 0.28, waveSpeed: 0.8, waveHeight: 0.25, bloomStrength: 0.3, bloomRadius: 0.25, maxPixelRatio: 1.5 },
};

const tierFor = (w: number): Tier => (w <= 720 ? 'mobile' : w <= 1050 ? 'tablet' : 'desktop');

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

type NetworkInfo = { saveData?: boolean };

/**
 * Data Saver, or a device with little memory or few cores (where a WebGL loop would compete with scrolling and
 * input), keeps the plain hero. deviceMemory and connection are Chromium-only; elsewhere this is simply false.
 */
function lowPowerDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: NetworkInfo };
  return Boolean(nav.connection?.saveData) || (nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency || 8) <= 2;
}

/** Runs `fn` once the page has loaded and the main thread is idle, so three.js never competes with the first paint or first input. */
function afterLoadIdle(fn: () => void) {
  let idle = 0;
  let timer = 0;
  const schedule = () => {
    // Safari has no requestIdleCallback.
    if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(fn, { timeout: 2000 });
    else timer = window.setTimeout(fn, 200);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  return () => {
    window.removeEventListener('load', schedule);
    if (idle) window.cancelIdleCallback(idle);
    window.clearTimeout(timer);
  };
}

/** Decorative WebGL light trails behind the hero. Progressive enhancement only. */
export default function HeroPhotonBackground() {
  const [tier, setTier] = useState<Tier | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (lowPowerDevice() || !supportsWebGL()) return;

    // PhotonBeam reads its props once on mount, so a tier change remounts it (via key).
    const update = () => setTier(reduced.matches ? null : tierFor(window.innerWidth));
    let started = false;
    const cancelStart = afterLoadIdle(() => {
      started = true;
      update();
      window.addEventListener('resize', update);
      reduced.addEventListener('change', update);
    });
    return () => {
      cancelStart();
      if (!started) return;
      window.removeEventListener('resize', update);
      reduced.removeEventListener('change', update);
    };
  }, []);

  return (
    <div className="hero-photon-clip" aria-hidden="true">
      {tier && (
        <div className="hero-photon-background">
          <PhotonBeam key={tier} {...COLORS} {...TIERS[tier]} />
        </div>
      )}
    </div>
  );
}
