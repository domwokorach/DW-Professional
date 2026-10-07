'use client';

import { useEffect, useState } from 'react';

/**
 * Returns the label of the section currently in view; labels map to ids by lower-casing.
 * Watches a band across the upper-middle of the viewport, keeps how much of each section is in it,
 * and picks the section covering most of the band, so a long section that stays on screen isn't
 * overridden by a neighbour merely crossing the edge.
 */
export function useActiveSection<T extends string>(labels: readonly T[], initial: T) {
  const [active, setActive] = useState<T>(initial);

  useEffect(() => {
    const byId = new Map(labels.map((l) => [l.toLowerCase(), l]));
    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver((entries) => {
      // Pixels of each section inside the band (not intersectionRatio, which penalises long sections).
      for (const e of entries) ratios.set(e.target.id, e.isIntersecting ? e.intersectionRect.height : 0);
      let best: string | undefined;
      let bestRatio = 0;
      ratios.forEach((r, id) => { if (r > bestRatio) { best = id; bestRatio = r; } });
      const label = best && byId.get(best);
      if (label) setActive(label);
    }, { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1] });

    byId.forEach((_, id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [labels]);

  return active;
}
