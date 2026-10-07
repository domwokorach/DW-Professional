'use client';

import type { ReactNode } from 'react';
import LogoLoop, { type LogoItem } from '@/components/ui/LogoLoop';
import { media } from '@/config';
import { useMediaQuery } from '@/composables';
import type { CoreTech } from '@/types';

/** A loop entry: the name and its icon, already rendered on the server (so the icon set never ships to the browser). */
export type CategoryItem = { name: CoreTech['name']; icon: ReactNode };

const item = (t: CategoryItem) => (
  <span className="core-tech__item">
    {t.icon}
    <span className="core-tech__name">{t.name}</span>
  </span>
);

/**
 * One category's technologies as a LogoLoop (the React Bits original of Vue Bits' LogoLoop).
 * LogoLoop exposes only the first copy of the list to assistive tech, so each name is read once.
 * Under reduced motion the same items render as a static wrapped list instead.
 */
export default function CategoryLoop({ items, label, direction }: { items: CategoryItem[]; label: string; direction: 'left' | 'right' }) {
  const reduced = useMediaQuery(media.reducedMotion);

  if (reduced) {
    return (
      <ul className="core-tech__static" aria-label={label}>
        {items.map((t) => <li key={t.name}>{item(t)}</li>)}
      </ul>
    );
  }

  const logos: LogoItem[] = items.map((t) => ({ node: item(t), title: t.name }));
  return (
    <LogoLoop
      logos={logos}
      speed={100}
      direction={direction}
      logoHeight={26}
      gap={0}
      pauseOnHover
      ariaLabel={label}
      className="core-tech__loop"
    />
  );
}
