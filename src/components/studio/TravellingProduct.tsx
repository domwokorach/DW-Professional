'use client';

import { useEffect, useRef } from 'react';

export type Stop = { x: number; y: number; rot: number; scale: number; opacity: number };

/** x and y are percentages of the viewport so the path holds at any size. */
export const STUDIO_STOPS: Stop[] = [
  { x: 74, y: 50, rot: 14, scale: 1, opacity: 1 }, // hero
  { x: 50, y: 70, rot: -8, scale: 0.62, opacity: 0.95 }, // argument
  { x: 10, y: 34, rot: 22, scale: 0.5, opacity: 0.9 }, // demonstration
  { x: 91, y: 56, rot: -16, scale: 0.5, opacity: 0.85 }, // material
  { x: 94, y: 40, rot: -26, scale: 0.4, opacity: 0 }, // gone by measurements
];
export const STUDIO_ANCHORS = ['#studio-top', '#argument', '#demo', '#material', '#measurements'];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** One fixed cut-out that follows the keyframed path as the page scrolls. Bound to scroll position, so it reverses. */
export default function TravellingProduct({
  stops = STUDIO_STOPS,
  anchors = STUDIO_ANCHORS,
  src = '/studio/product.svg',
  className = 'studio-product',
}: {
  stops?: Stop[];
  /** CSS selectors of the sections the stops are pinned to, top to bottom. */
  anchors?: string[];
  src?: string;
  className?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let tops: number[] = [];
    let frame = 0;

    const measure = () => {
      tops = anchors.map((sel) => document.querySelector(sel)?.getBoundingClientRect().top ?? 0).map(
        (t) => t + window.scrollY,
      );
    };

    const render = () => {
      frame = 0;
      measure(); // sections can change height after load (images, lazy content), so re-read each frame
      const y = window.scrollY;
      let i = 0;
      while (i < tops.length - 2 && y >= tops[i + 1]) i++;
      const span = Math.max(1, tops[i + 1] - tops[i]);
      const t = ease(Math.min(1, Math.max(0, (y - tops[i]) / span)));
      const a = stops[i];
      const b = stops[i + 1];
      const narrow = window.innerWidth < 800 ? 0.6 : 1;
      const opacity = lerp(a.opacity, b.opacity, t);
      el.style.opacity = String(opacity * (narrow < 1 ? 0.55 : 1));
      el.style.visibility = opacity <= 0.001 ? 'hidden' : 'visible';
      el.style.transform = `translate3d(${lerp(a.x, b.x, t)}vw, ${lerp(a.y, b.y, t)}vh, 0) translate(-50%, -50%) rotate(${lerp(a.rot, b.rot, t)}deg) scale(${lerp(a.scale, b.scale, t) * narrow})`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [stops, anchors]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative SVG cut-out, moved with inline transforms
    <img ref={ref} className={className} src={src} alt="" aria-hidden="true" />
  );
}
