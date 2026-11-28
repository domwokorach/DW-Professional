import { useSyncExternalStore } from 'react';

export type CarouselVariant = 'desktop' | 'tablet' | 'mobile';

export type SlideState = { x: string; scale: number; opacity: number; zIndex: number; hidden: boolean };

type Tier = { x: number; scale: number; opacity: number };
type VariantConfig = { visible: number; near: Tier; far: Tier };

/** x is a percentage of the slide's own width, so the stack scales with the stage. */
const CONFIG: Record<CarouselVariant, VariantConfig> = {
  desktop: { visible: 2, near: { x: 27, scale: 0.8, opacity: 0.85 }, far: { x: 45, scale: 0.6, opacity: 0.45 } },
  tablet: { visible: 1, near: { x: 56, scale: 0.82, opacity: 0.8 }, far: { x: 80, scale: 0.64, opacity: 0.45 } },
  mobile: { visible: 1, near: { x: 25, scale: 0.84, opacity: 0.7 }, far: { x: 40, scale: 0.7, opacity: 0.45 } },
};

/** Shortest signed distance from the active slide, wrapping around the list (e.g. -3…4 for eight items). */
export function circularOffset(index: number, active: number, count: number): number {
  const d = (((index - active) % count) + count) % count;
  return d > count / 2 ? d - count : d;
}

/** Target position of a slide at `offset` from the active one. Slides beyond the visible range tuck behind the far cards and fade out. */
export function slideState(offset: number, variant: CarouselVariant): SlideState {
  const { visible, near, far } = CONFIG[variant];
  const abs = Math.abs(offset);
  const sign = offset < 0 ? -1 : 1;
  if (abs === 0) return { x: '0%', scale: 1, opacity: 1, zIndex: 5, hidden: false };
  if (abs === 1) return { x: `${sign * near.x}%`, scale: near.scale, opacity: near.opacity, zIndex: 3, hidden: false };
  const tier = abs === 2 && visible >= 2;
  return { x: `${sign * far.x}%`, scale: far.scale, opacity: tier ? far.opacity : 0, zIndex: 1, hidden: !tier };
}

const queries = ['(min-width: 1024px)', '(min-width: 768px)'] as const;

function subscribe(onChange: () => void) {
  const lists = queries.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener('change', onChange));
  return () => lists.forEach((l) => l.removeEventListener('change', onChange));
}

function snapshot(): CarouselVariant {
  if (window.matchMedia(queries[0]).matches) return 'desktop';
  return window.matchMedia(queries[1]).matches ? 'tablet' : 'mobile';
}

/** Breakpoint for the stack layout. Server and hydration render 'desktop'; React then reconciles to the real value. */
export function useCarouselVariant(): CarouselVariant {
  return useSyncExternalStore(subscribe, snapshot, () => 'desktop');
}

export const carouselSpring = { type: 'spring', stiffness: 260, damping: 30, mass: 0.8 } as const;
