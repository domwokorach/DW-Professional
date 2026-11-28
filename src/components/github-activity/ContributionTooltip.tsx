'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { formatLongDate, type ContributionDay } from '@/lib/github-contributions';

export type TooltipAnchor = { day: ContributionDay; x: number; y: number; below: boolean };

/** Shared tooltip for the hovered or focused day. Decorative: every cell already carries the same text as its name. */
export default function ContributionTooltip({ anchor }: { anchor: TooltipAnchor | null }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {anchor ? (
        <motion.div
          key="tip"
          aria-hidden="true"
          className="gh-tooltip"
          data-below={anchor.below || undefined}
          style={{ left: anchor.x, top: anchor.y }}
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: reduce ? 0 : 0.14, ease: 'easeOut' }}
        >
          <strong>{anchor.day.count === 0 ? 'No contributions' : `${anchor.day.count} contribution${anchor.day.count === 1 ? '' : 's'}`}</strong>
          <span>{formatLongDate(anchor.day.date)}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
