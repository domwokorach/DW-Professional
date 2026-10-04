'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Runs `prepare` on mount (to set the hidden start state) and `play` the first time
 * the element is at least `threshold` visible. Skips both under reduced motion, so
 * the server-rendered final text simply stays. `play` may return a cleanup.
 */
export function useRevealOnce(
  ref: RefObject<HTMLElement | null>,
  prepare: (el: HTMLElement) => void,
  play: (el: HTMLElement) => (() => void) | void,
  threshold = 0.3,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    prepare(el);
    let cleanup: (() => void) | void;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      cleanup = play(el);
    }, { threshold });
    io.observe(el);
    return () => { io.disconnect(); cleanup?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
