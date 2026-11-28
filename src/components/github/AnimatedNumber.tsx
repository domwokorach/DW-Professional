'use client';

import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

const format = (n: number) => Math.round(n).toLocaleString('en-GB');

/**
 * Counts up to `value` (from 0 the first time, then from the number it was showing), writing straight to the DOM so a
 * 60fps count never re-renders React. Reduced motion, or no change, shows the final number at once.
 */
export default function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || shown.current === value) { shown.current = value; el.textContent = format(value); return; }
    const controls = animate(shown.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { shown.current = v; el.textContent = format(v); },
      onComplete: () => { shown.current = value; el.textContent = format(value); },
    });
    return () => controls.stop();
  }, [value, reduce]);

  // The server/first paint already holds the final figure, so assistive tech and no-JS readers never see "0".
  return <span ref={ref}>{format(value)}</span>;
}
