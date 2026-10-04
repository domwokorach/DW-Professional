'use client';

import { useEffect, useRef } from 'react';
import { HERO_ZONES, type HeroDirection } from '@/config';

/** Sectors clockwise from screen-right, 45° each (y points down, so +90° is below). */
const SECTORS: HeroDirection[] = ['right', 'downRight', 'down', 'downLeft', 'left', 'upLeft', 'up', 'upRight'];

/** Angular distance from `angle` to the centre of sector `i`, in degrees (0…180). */
function offFrom(angle: number, i: number) {
  return Math.abs(((angle - i * 45) % 360 + 540) % 360 - 180);
}

/** Picks the direction for a normalised pointer position, sticking to `current` near zone edges. */
export function pickDirection(x: number, y: number, current: HeroDirection): HeroDirection {
  const r = Math.hypot(x, y);
  if (r < (current === 'neutral' ? HERO_ZONES.enter : HERO_ZONES.exit)) return 'neutral';
  const angle = (Math.atan2(y, x) * 180) / Math.PI;
  const held = SECTORS.indexOf(current);
  if (held >= 0 && offFrom(angle, held) <= 22.5 + HERO_ZONES.hysteresis) return current;
  return SECTORS[Math.round((((angle % 360) + 360) % 360) / 45) % 8];
}

/**
 * Reports which way the pointer is from the viewport centre. Pointer moves are only stored; the direction is
 * worked out once per animation frame, and `onChange` fires only when it actually changes. Leaving the window or
 * losing focus returns to 'neutral'. Touch input is ignored.
 */
export function usePointerDirection(enabled: boolean, onChange: (dir: HeroDirection) => void) {
  const change = useRef(onChange);
  change.current = onChange;

  useEffect(() => {
    if (!enabled) return;
    let dir: HeroDirection = 'neutral';
    let frame = 0;
    let px = 0;
    let py = 0;

    const set = (next: HeroDirection) => {
      if (next === dir) return;
      dir = next;
      change.current(next);
    };
    const tick = () => {
      frame = 0;
      set(pickDirection((px / window.innerWidth) * 2 - 1, (py / window.innerHeight) * 2 - 1, dir));
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      set('neutral');
    };

    const root = document.documentElement;
    window.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
      cancelAnimationFrame(frame);
      change.current('neutral');
    };
  }, [enabled]);
}
