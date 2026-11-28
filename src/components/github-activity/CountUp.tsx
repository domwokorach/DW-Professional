'use client';

import { animate } from 'motion';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

/** A number that counts up when it first appears with real data (no animation under reduced motion). */
export default function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = value.toLocaleString('en-GB');
      return;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = Math.round(v).toLocaleString('en-GB')),
    });
    return () => controls.stop();
  }, [value, reduce]);
  // Server and first client render both print the final value, so there is no hydration mismatch.
  return <span ref={ref} suppressHydrationWarning>{value.toLocaleString('en-GB')}</span>;
}
