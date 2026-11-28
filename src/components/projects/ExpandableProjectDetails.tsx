'use client';

import { useEffect, useId, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, MotionConfig } from 'motion/react';
import type { Project } from '@/types';
import ExpandedProjectDialog from './ExpandedProjectDialog';

const subscribeNever = () => () => {};

/** Modal with the full project details. Locks background scroll while open; the caller owns focus return. */
export default function ExpandableProjectDetails({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const uid = useId();
  // False during SSR and hydration, true afterwards, so the portal target (document.body) always exists when used.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

  useEffect(() => {
    if (!project) return;
    const { body, documentElement } = document;
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const gap = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => { body.style.overflow = prev.overflow; body.style.paddingRight = prev.paddingRight; };
  }, [project]);

  if (!mounted) return null;
  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {project && <ExpandedProjectDialog key={project.id} project={project} uid={uid} onClose={onClose} />}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
