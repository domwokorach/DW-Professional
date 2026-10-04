'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Fades `selector` children of `ref` in as they scroll into view, staggered within each batch.
 * Returns true once the hidden start state may be applied (JS running, motion allowed), so
 * server-rendered content stays visible without JS or under reduced motion.
 * Visible items get `is-visible`.
 */
export function useStaggerReveal(
  ref: RefObject<HTMLElement | null>,
  selector: string,
  { stagger = 70, threshold = 0.12, rootMargin = '0px 0px -8% 0px' } = {},
) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    setEnabled(true);
    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e, i) => {
        const item = e.target as HTMLElement;
        item.style.transitionDelay = `${i * stagger}ms`;
        item.classList.add('is-visible');
        io.unobserve(item);
      });
    }, { rootMargin, threshold });
    el.querySelectorAll(selector).forEach((item) => io.observe(item));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return enabled;
}
