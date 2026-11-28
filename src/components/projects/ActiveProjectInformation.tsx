'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Maximize2 } from 'lucide-react';
import type { Project } from '@/types';
import ProjectStatus from './ProjectStatus';

/** Details of the centred project: category, status, headline and the View details action. */
export default function ActiveProjectInformation({ project: p, reduced, onOpen }: { project: Project; reduced: boolean; onOpen: () => void }) {
  return (
    <div className="pcr__info">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={p.id}
          className="pcr__info-inner"
          initial={{ opacity: 0, y: reduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -6 }}
          transition={{ duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="pcr__meta">
            <span className="pcr__cat"><span className="sr-only">Category: </span>{p.category}</span>
            {p.url && <ProjectStatus />}
          </p>
          <h3 className="pcr__title">{p.title}</h3>
          {p.headline && <p className="pcr__headline">{p.headline}</p>}
          <button type="button" className="pcr__open" aria-haspopup="dialog" data-pcr-open onClick={onOpen}>
            <span>View details</span>
            <span className="sr-only">: {p.title}</span>
            <Maximize2 aria-hidden="true" size={15} strokeWidth={1.8} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
