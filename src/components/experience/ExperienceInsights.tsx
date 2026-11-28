'use client';

import { Briefcase, Target, Trophy, type LucideIcon } from 'lucide-react';
import { MotionConfig, motion, type Variants } from 'motion/react';
import { useCollapseOpen } from './ExperienceCollapse';

export type InsightBlock = { key: 'responsibilities' | 'challenges' | 'achievements'; heading: string; items: string[] };

const ICONS: Record<InsightBlock['key'], LucideIcon> = { responsibilities: Briefcase, challenges: Target, achievements: Trophy };

/** Responsibilities, Problems & Challenges and Achievements: three columns when there is room, stacked otherwise. */
export default function ExperienceInsights({ id, blocks, nested }: { id: string; blocks: InsightBlock[]; nested?: boolean }) {
  const open = useCollapseOpen();
  const Heading = nested ? 'h5' : 'h4';

  // Identical on server and client; MotionConfig drops the movement (keeping a plain fade) for visitors who prefer reduced motion.
  const list: Variants = { hide: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } } };
  const block: Variants = {
    hide: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="xp-insights-wrap">
    <motion.div className="xp-insights" data-count={blocks.length} variants={list} initial={open ? 'show' : 'hide'} animate={open ? 'show' : 'hide'}>
      {blocks.map(({ key, heading, items }) => {
        const Icon = ICONS[key];
        const headingId = `${id}-${key}`;
        return (
          <motion.section key={key} className={`xp-insight xp-insight--${key}`} aria-labelledby={headingId} variants={block}>
            <Heading id={headingId} className="xp-insight__title">
              <span className="xp-insight__icon" aria-hidden="true"><Icon size={16} strokeWidth={1.7} /></span>
              {heading}
            </Heading>
            <ul className="xp-bullets">
              {items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </motion.section>
        );
      })}
    </motion.div>
    </div>
    </MotionConfig>
  );
}
