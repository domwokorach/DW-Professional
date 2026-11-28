'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, motion, MotionConfig, useMotionValue, type PanInfo } from 'motion/react';
import { useReducedMotionSafe } from '@/hooks/use-reduced-motion-safe';
import type { Project } from '@/types';
import ActiveProjectInformation from './ActiveProjectInformation';
import ExpandableProjectDetails from './ExpandableProjectDetails';
import ProjectCarouselControls from './ProjectCarouselControls';
import ProjectCarouselPagination from './ProjectCarouselPagination';
import ProjectCarouselSlide from './ProjectCarouselSlide';
import { carouselSpring, circularOffset, slideState, useCarouselVariant } from './carousel-config';

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 450;
const DRAG_RESISTANCE = 0.35;

/** Centre-focused stack of project cards with circular navigation. `initialIndex` is the project shown first. */
export default function ProjectCarousel({ projects, initialIndex = 0 }: { projects: Project[]; initialIndex?: number }) {
  const count = projects.length;
  const [index, setIndex] = useState(initialIndex);
  const [openId, setOpenId] = useState<string | null>(null);
  // Skip the spring on first paint so the layout settles (e.g. mobile) without visible movement.
  const [settled, setSettled] = useState(false);
  const variant = useCarouselVariant();
  const reduced = useReducedMotionSafe();
  const dragX = useMotionValue(0);
  const dragged = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const step = useCallback((by: number) => setIndex((i) => (((i + by) % count) + count) % count), [count]);
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);
  const select = useCallback((offset: number) => {
    if (dragged.current || offset === 0) return;
    step(offset);
  }, [step]);

  const settle = useCallback(() => {
    animate(dragX, 0, reduced ? { duration: 0 } : carouselSpring);
  }, [dragX, reduced]);

  const onPan = (_: PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 6) dragged.current = true;
    dragX.set(info.offset.x * DRAG_RESISTANCE);
  };
  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    if (info.offset.x <= -SWIPE_DISTANCE || info.velocity.x <= -SWIPE_VELOCITY) next();
    else if (info.offset.x >= SWIPE_DISTANCE || info.velocity.x >= SWIPE_VELOCITY) prev();
    settle();
    // The click that follows a drag must not select a neighbour.
    window.setTimeout(() => { dragged.current = false; }, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(count - 1); }
  };

  const closeDetails = useCallback(() => {
    setOpenId(null);
    // Return focus to the View details button, which stays mounted while the dialog is open.
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-pcr-open]')?.focus({ preventScroll: true }));
  }, []);

  const transition = !settled || reduced ? { duration: 0 } : carouselSpring;
  const active = projects[index];
  const open = projects.find((p) => p.id === openId) ?? null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="pcr">
        <div
          className="pcr__carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label="Projects"
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <div className="pcr__viewport">
            <motion.div className="pcr__stage" onPan={onPan} onPanEnd={onPanEnd} style={{ touchAction: 'pan-y' }}>
              <motion.div className="pcr__track" style={{ x: dragX }}>
                {projects.map((p, i) => {
                  const offset = circularOffset(i, index, count);
                  return (
                    <ProjectCarouselSlide
                      key={p.id}
                      project={p}
                      position={i + 1}
                      total={count}
                      offset={offset}
                      state={slideState(offset, variant)}
                      transition={transition}
                      priority={i === initialIndex}
                      onSelect={select}
                    />
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">Project {index + 1} of {count}: {active.title}</p>
          <ProjectCarouselControls onPrev={prev} onNext={next}>
            <ProjectCarouselPagination projects={projects} active={index} onSelect={goTo} />
          </ProjectCarouselControls>
        </div>
        <ActiveProjectInformation project={active} reduced={reduced} onOpen={() => setOpenId(active.id)} />
      </div>
      <ExpandableProjectDetails project={open} onClose={closeDetails} />
    </MotionConfig>
  );
}
