'use client';

import { useActiveSection } from '@/hooks';

export interface TimelineNavItem {
  /** Id of the entry's <article> (or the education section); the jump target. */
  id: string;
  year: string;
  label: string;
}

/**
 * Chronological jump links, newest first, matching the timeline order. The entry currently in view is
 * highlighted and marked aria-current="location", so sighted and screen-reader users share one position.
 * Plain anchors: mouse, touch and keyboard all work, and the page's own smooth scrolling (reduced-motion aware) applies.
 */
export default function TimelineNav({ items }: { items: TimelineNavItem[] }) {
  const ids = items.map((i) => i.id);
  const active = useActiveSection(ids, ids[0]);
  return (
    <nav className="xp-nav" aria-label="Career timeline">
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined}>
              <span className="xp-nav__year">{item.year}</span>{' '}
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
