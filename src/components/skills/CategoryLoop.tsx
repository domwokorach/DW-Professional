'use client';

import { LogoLoop, TechIcon, type LogoItem } from '@/components/ui';
import { media } from '@/config';
import { useMediaQuery } from '@/composables';
import type { CoreTech } from '@/types';

const item = (t: CoreTech) => (
  <span className="core-tech__item">
    <TechIcon icon={t.icon} fallback={t.name} className="core-tech__icon" color={t.color} />
    <span className="core-tech__name">{t.name}</span>
  </span>
);

/**
 * One category's technologies as a LogoLoop (the React Bits original of Vue Bits' LogoLoop).
 * LogoLoop exposes only the first copy of the list to assistive tech, so each name is read once.
 * Under reduced motion the same items render as a static wrapped list instead.
 */
export default function CategoryLoop({ items, label, direction }: { items: CoreTech[]; label: string; direction: 'left' | 'right' }) {
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
