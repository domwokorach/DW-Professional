'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/**
 * `prefers-reduced-motion`, safe to use when it changes the rendered markup. The server snapshot is
 * always `false`, so the first client render matches the server HTML; React then re-renders with the
 * real value. (motion's `useReducedMotion` reads the media query during the first client render, which
 * hydrates differently from the server HTML for visitors who prefer reduced motion — React error #418,
 * which also made React discard the `data-theme` attribute on <html>.)
 */
export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
