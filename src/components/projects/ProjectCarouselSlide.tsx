'use client';

import { memo } from 'react';
import { motion, type Transition } from 'motion/react';
import type { Project } from '@/types';
import ProjectImage from './ProjectImage';
import type { SlideState } from './carousel-config';

type Props = {
  project: Project;
  position: number;
  total: number;
  offset: number;
  state: SlideState;
  transition: Transition;
  priority: boolean;
  onSelect: (offset: number) => void;
};

/**
 * One card in the stack. Only the centre card is exposed to assistive technology; neighbours are
 * mouse/touch shortcuts (keyboard users have the arrows and pagination), and cards outside the
 * visible range are also inert.
 */
function ProjectCarouselSlide({ project: p, position, total, offset, state, transition, priority, onSelect }: Props) {
  const active = offset === 0;
  return (
    <motion.div
      className={`pcr__slide${active ? ' is-active' : ''}`}
      role="group"
      aria-roledescription="slide"
      aria-label={`Project ${position} of ${total}: ${p.title}`}
      aria-hidden={active ? undefined : true}
      inert={state.hidden}
      data-offset={offset}
      initial={false}
      animate={{ x: state.x, scale: state.scale, opacity: state.opacity }}
      transition={transition}
      style={{ zIndex: state.zIndex, pointerEvents: state.hidden ? 'none' : undefined }}
      onClick={() => onSelect(offset)}
    >
      {p.image ? (
        <ProjectImage
          project={p}
          alt={active ? `${p.title} screenshot` : ''}
          sizes="(min-width: 1024px) 700px, (min-width: 768px) 50vw, 70vw"
          priority={priority}
        />
      ) : (
        <div className="pcr__placeholder">
          <span className="pcr__placeholder-cat">{p.category}</span>
          <span className="pcr__placeholder-title">{p.title}</span>
          <span className="pcr__placeholder-note">Details coming soon</span>
        </div>
      )}
    </motion.div>
  );
}

export default memo(ProjectCarouselSlide);
