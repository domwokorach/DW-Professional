'use client';

import { useEffect, useRef } from 'react';
import { clamp } from '../motion';

/** Pointer normalised to the viewport centre: x right, y up, each -1…1. null = no pointer (look ahead). */
export type PointerTarget = { x: number; y: number } | null;

/** True on devices whose only input can't hover (phones, most tablets). */
const isTouchOnly = () => !window.matchMedia('(any-hover: hover)').matches;

/**
 * Tracks the mouse in a ref (never React state, so the render loop reads it without re-rendering).
 * Resets to null when the pointer leaves the window, the tab loses focus, or tracking is disabled;
 * the gaze springs then ease back to a neutral, forward-facing pose. Touch input is ignored.
 */
export function usePointerTracking(enabled: boolean) {
  const pointer = useRef<PointerTarget>(null);

  useEffect(() => {
    pointer.current = null;
    if (!enabled || isTouchOnly()) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointer.current = {
        x: clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1),
        y: clamp(-(e.clientY / window.innerHeight) * 2 + 1, -1, 1),
      };
    };
    const onLeave = () => { pointer.current = null; };
    const onOut = (e: PointerEvent) => { if (!e.relatedTarget) onLeave(); };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onOut);
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onOut);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      pointer.current = null;
    };
  }, [enabled]);

  return pointer;
}
