'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { formatLongDate, plural } from '@/lib/github/stats';
import type { ContributionDay } from '@/lib/github/types';

export interface TooltipAnchor { x: number; y: number; below: boolean; width: number }

/** Fixed 224px wide (see .gh-tooltip) so `half` below is exact. Visual tooltip for the active day. Screen readers get the same text from the cell's aria-label, so this is aria-hidden. */
export default function ContributionTooltip({ day, anchor }: { day: ContributionDay | null; anchor: TooltipAnchor | null }) {
  const reduce = useReducedMotion();
  const half = 112;
  const left = Math.min(Math.max(anchor?.x ?? 0, half), Math.max((anchor?.width ?? 0) - half, half));
  return (
    <AnimatePresence>
      {day && anchor ? (
        <motion.div
          key="tip"
          className="gh-tooltip"
          aria-hidden="true"
          data-below={anchor.below}
          style={{ left, top: anchor.y, translateX: '-50%', translateY: anchor.below ? '0%' : '-100%' }}
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          transition={{ duration: reduce ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          <strong>{day.contributionCount === 0 ? 'No contributions' : plural(day.contributionCount, 'contribution')}</strong>
          <span>{formatLongDate(day.date)}</span>
          <i className="gh-tooltip__arrow" style={{ left: anchor.x - left + half }} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
