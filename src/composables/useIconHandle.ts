import { useCallback, useEffect, useRef, type FocusEvent, type PointerEvent } from 'react';
import { useReducedMotion } from 'motion/react';

/** What a Lucide Animated icon exposes through its ref. */
export type IconHandle = { startAnimation: () => void; stopAnimation: () => void };

/**
 * Drives a Lucide Animated icon from its whole parent control (button, link), like useIconTrigger does for
 * Animate UI icons: mouse/pen hover and keyboard focus (focus-visible only) start it, leaving or blurring
 * returns it, and on touch a tap plays it briefly (touch has no real hover). Never animates under
 * prefers-reduced-motion. Pass `ref` to the icon and spread `bind` on the parent.
 */
export function useIconHandle<H extends IconHandle = IconHandle>() {
  const ref = useRef<H>(null);
  const reduce = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = useCallback(() => { if (!reduce) ref.current?.startAnimation(); }, [reduce]);
  const stop = useCallback(() => { clearTimeout(timer.current); ref.current?.stopAnimation(); }, []);

  const bind = {
    onPointerEnter: (e: PointerEvent<HTMLElement>) => { if (e.pointerType !== 'touch') start(); },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => { if (e.pointerType !== 'touch') stop(); },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'touch') return;
      start();
      clearTimeout(timer.current);
      timer.current = setTimeout(stop, 800);
    },
    onFocus: (e: FocusEvent<HTMLElement>) => { if (e.target.matches(':focus-visible')) start(); },
    onBlur: stop,
  };

  return { ref, bind };
}
