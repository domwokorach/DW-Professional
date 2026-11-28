'use client';

import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { X } from 'lucide-react';
import type { Project } from '@/types';
import ProjectExternalLink from './ProjectExternalLink';
import ProjectImage from './ProjectImage';
import ProjectStatus from './ProjectStatus';
import ProjectTechnologyList from './ProjectTechnologyList';
import { cardIds } from './project-ids';

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
const spring = { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 } as const;
const reveal: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.16 + i * 0.05, duration: 0.32, ease: [0.22, 1, 0.36, 1] } }),
};

/** Expanded project: modal dialog with Escape, outside-click, focus trap and scrollable content. */
export default function ExpandedProjectDialog({ project: p, uid, onClose }: { project: Project; uid: string; onClose: () => void }) {
  const ids = cardIds(p.id, uid);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const current = document.activeElement;
    if (e.shiftKey && (current === first || !panelRef.current.contains(current))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (current === last || !panelRef.current.contains(current))) { e.preventDefault(); first.focus(); }
  };

  return (
    <div className="xp-layer" onKeyDown={onKeyDown}>
      <motion.div
        className="xp-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="xp-stage" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={spring}
          className="xp-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${ids.title}-h`}
          style={{ borderRadius: 22 }}
        >
          <button ref={closeRef} type="button" className="xp-close" aria-label={`Close ${p.title} details`} onClick={onClose}>
            <X aria-hidden="true" size={18} strokeWidth={2} />
          </button>
          <div className="xp-scroll">
            {p.image && (
  <div className="xp-panel__shot" style={{ aspectRatio: p.image ? `${p.image.width} / ${p.image.height}` : undefined }}>
                <ProjectImage project={p} alt={`${p.title} website screenshot`} sizes="(max-width: 960px) 100vw, 900px" priority />
              </div>
            )}
            <div className="xp-panel__body">
              <div className="xp-panel__meta">
                <motion.span className="xp-panel__cat">{p.category}</motion.span>
                {p.url && <ProjectStatus />}
              </div>
              <motion.h3 id={`${ids.title}-h`} className="xp-panel__title">{p.title}</motion.h3>
              {p.headline && <motion.p custom={0} variants={reveal} initial="hidden" animate="shown" className="xp-panel__sub">{p.headline}</motion.p>}
              <motion.div custom={1} variants={reveal} initial="hidden" animate="shown" className="xp-panel__desc">
                {p.description.map((para) => <p key={para}>{para}</p>)}
              </motion.div>
              {p.features && p.features.length > 0 && (
                <motion.section custom={2} variants={reveal} initial="hidden" animate="shown" className="xp-section" aria-labelledby={`${ids.card}-features`}>
                  <h4 id={`${ids.card}-features`}>Key features</h4>
                  <ul className="xp-features">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                </motion.section>
              )}
              <motion.section custom={3} variants={reveal} initial="hidden" animate="shown" className="xp-section" aria-labelledby={`${ids.card}-focus`}>
                <h4 id={`${ids.card}-focus`}>Focus areas</h4>
                <p className="xp-focus">{p.focus.join(' · ')}</p>
              </motion.section>
              <motion.section custom={4} variants={reveal} initial="hidden" animate="shown" className="xp-section" aria-labelledby={`${ids.card}-tech`}>
                <h4 id={`${ids.card}-tech`}>Technologies and skills</h4>
                <ProjectTechnologyList tech={p.tech} label={`${p.title} technologies and skills`} />
              </motion.section>
              <motion.div custom={5} variants={reveal} initial="hidden" animate="shown" className="xp-actions">
                <ProjectExternalLink project={p} />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
