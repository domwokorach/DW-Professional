'use client';

import { motion } from 'motion/react';
import { Maximize2 } from 'lucide-react';
import type { Project } from '@/types';
import ProjectImage from './ProjectImage';
import ProjectStatus from './ProjectStatus';
import { cardIds } from './project-ids';

/** Collapsed project card: a single button that opens the expanded dialog. */
export default function ExpandableProjectCard({ project: p, uid, expanded, onOpen }: { project: Project; uid: string; expanded: boolean; onOpen: () => void }) {
  const ids = cardIds(p.id, uid);
  return (
    <motion.button
      type="button"
      layoutId={ids.card}
      className="xp-card"
      data-xp-card={p.id}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      onClick={onOpen}
      style={{ borderRadius: 18 }}
    >
      <motion.div layoutId={ids.image} className="xp-card__shot">
        <ProjectImage project={p} sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 384px" />
      </motion.div>
      <span className="xp-card__body">
        <span className="xp-card__meta">
          <motion.span layoutId={ids.category} className="xp-card__cat"><span className="sr-only">Category: </span>{p.category}</motion.span>
          {p.url && <ProjectStatus />}
        </span>
        <motion.span layoutId={ids.title} className="xp-card__title">{p.title}</motion.span>
        {p.headline && <span className="xp-card__headline">{p.headline}</span>}
        <span className="xp-card__open"><span>View details</span><Maximize2 aria-hidden="true" size={15} strokeWidth={1.8} /></span>
      </span>
    </motion.button>
  );
}
