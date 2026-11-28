'use client';

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { useStaggerReveal } from '@/hooks';
import type { Project } from '@/types';
import ExpandableProjectCard from './ExpandableProjectCard';
import ExpandedProjectDialog from './ExpandedProjectDialog';

const subscribeNever = () => () => {};

/** Three-column (two on tablet, one on mobile) gallery where one card at a time expands into a dialog. */
export default function ExpandableProjectGallery({ projects }: { projects: Project[] }) {
  const uid = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  // False during SSR and hydration, true afterwards, so the portal target (document.body) always exists when used.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const listRef = useRef<HTMLUListElement>(null);
  const reveal = useStaggerReveal(listRef, '.pg-item');
  const active = projects.find((p) => p.id === activeId) ?? null;

  // Lock background scroll while open, without the page shifting when the scrollbar disappears.
  useEffect(() => {
    if (!active) return;
    const { body, documentElement } = document;
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const gap = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => { body.style.overflow = prev.overflow; body.style.paddingRight = prev.paddingRight; };
  }, [active]);

  const close = useCallback(() => {
    const id = activeId;
    setActiveId(null);
    // Return focus to the card that opened the dialog.
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-xp-card="${id}"]`)?.focus({ preventScroll: true }));
  }, [activeId]);

  return (
    <MotionConfig reducedMotion="user">
      <ul ref={listRef} className={`xp-grid${reveal ? ' pg-reveal' : ''}`}>
        {projects.map((p) => (
          <li key={p.id} className="pg-item">
            <ExpandableProjectCard project={p} uid={uid} expanded={activeId === p.id} onOpen={() => setActiveId(p.id)} />
          </li>
        ))}
      </ul>
      {mounted && createPortal(
        <AnimatePresence>
          {active && <ExpandedProjectDialog key={active.id} project={active} uid={uid} onClose={close} />}
        </AnimatePresence>,
        document.body,
      )}
    </MotionConfig>
  );
}
