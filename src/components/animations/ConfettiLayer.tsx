'use client';

import { useEffect, useRef } from 'react';
import { Confetti, type ConfettiRef } from '@/components/ui/confetti';

// Stable object so the component doesn't see a new options value on every render. `useWorker` is off: a
// 36-particle burst is trivial to draw on the main thread, and the worker mode hands the canvas to an
// OffscreenCanvas that can only be transferred once, which breaks under React's double-run effects in
// development (and isn't available in every browser). `disableForReducedMotion` is canvas-confetti's own
// guard, on top of callers not firing at all under prefers-reduced-motion.
const GLOBAL_OPTIONS = { resize: true, useWorker: false, disableForReducedMotion: true };

/**
 * A full-viewport, click-through canvas for the Magic UI Confetti to draw on. Loaded lazily (see
 * ConfettiOnInteract). `onReady` is called from an effect that runs after Confetti has created its
 * canvas-confetti instance (a ref callback would run too early, and `fire()` would silently do nothing).
 */
export default function ConfettiLayer({ onReady }: { onReady: (api: ConfettiRef) => void }) {
  const ref = useRef<ConfettiRef>(null);
  useEffect(() => {
    if (ref.current) onReady(ref.current);
  }, [onReady]);
  return <Confetti ref={ref} manualstart className="confetti-layer" aria-hidden="true" globalOptions={GLOBAL_OPTIONS} />;
}
