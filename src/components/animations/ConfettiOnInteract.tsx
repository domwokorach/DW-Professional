'use client';

import { lazy, Suspense, useCallback, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Options } from 'canvas-confetti';
import type { ConfettiRef } from '@/components/ui/confetti';

// canvas-confetti is only downloaded the first time someone interacts with the text.
const ConfettiLayer = lazy(() => import('./ConfettiLayer'));

/** Brand colours: navy, gold, blue, cyan, cream. */
const COLORS = ['#25233f', '#DA9C14', '#2563EB', '#0891B2', '#F1EEDF'];
/** A small, short burst: enough to notice, too little to cover anything. */
const BURST: Options = {
  particleCount: 36,
  spread: 70,
  startVelocity: 24,
  gravity: 1.1,
  decay: 0.92,
  ticks: 110,
  scalar: 0.85,
  colors: COLORS,
};
const COOLDOWN_MS = 1400;

/**
 * Fires a Magic UI Confetti burst from the pointer when the wrapped text is hovered (mouse), clicked or
 * tapped. A cooldown stops repeated bursts, and nothing fires under prefers-reduced-motion. Purely
 * decorative: the text itself is unchanged and nothing depends on it.
 */
export default function ConfettiOnInteract({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const layer = useRef<ConfettiRef | null>(null);
  const pending = useRef<Options | null>(null);
  const last = useRef(0);

  // Called once the lazy canvas is ready (twice in development, where React double-runs effects: the second
  // run is the one that survives, because the first instance is reset).
  const onReady = useCallback((api: ConfettiRef) => {
    layer.current = api;
    const options = pending.current;
    if (!options) return;
    void api.fire(options);
    setTimeout(() => { if (pending.current === options) pending.current = null; }, 100);
  }, []);

  const burst = (e: PointerEvent<HTMLElement> | MouseEvent<HTMLElement>) => {
    if (reduce) return;
    const now = performance.now();
    if (now - last.current < COOLDOWN_MS) return;
    last.current = now;
    const options: Options = { ...BURST, origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight } };
    setArmed(true); // mounts the lazy canvas the first time
    if (layer.current) void layer.current.fire(options);
    else pending.current = options; // fired as soon as the canvas has loaded
  };

  return (
    <div
      className="confetti-target"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') burst(e); }}
      onClick={burst}
    >
      {children}
      {armed && (
        <Suspense fallback={null}>
          <ConfettiLayer onReady={onReady} />
        </Suspense>
      )}
    </div>
  );
}
