'use client';

import { useEffect } from 'react';

/**
 * Enables motion only when prefers-reduced-motion is not set. It adds `motion-ok` to the page root (every reveal
 * rule is scoped to it), fires entry reveals once, and spreads the hero wordmark with scroll position (reversible).
 */
export default function StudioMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.studio');
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.classList.add('motion-ok');

    // Entry reveals fire once and never un-reveal.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    root.querySelectorAll('.reveal').forEach((n) => io.observe(n));

    // Hero wordmark: revealed on load, spread from the centre outward and sunk as the page leaves the hero.
    const letters = Array.from(root.querySelectorAll<HTMLElement>('.studio-hero .wm-letter'));
    requestAnimationFrame(() => root.classList.add('wm-loaded'));
    let frame = 0;
    const spread = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.8)));
      const mid = (letters.length - 1) / 2;
      letters.forEach((l, i) => {
        l.style.setProperty('--dx', `${((i - mid) / Math.max(1, mid)) * p * 6}vw`);
        l.style.setProperty('--dy', `${p * 0.25}em`);
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(spread);
    };
    spread();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
      root.classList.remove('motion-ok', 'wm-loaded');
    };
  }, []);

  return null;
}
