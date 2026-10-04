"use client";
// Adapted from Aceternity UI "Animated Testimonials" (https://ui.aceternity.com/registry/animated-testimonials.json),
// the React original of Inspira UI's Vue port. Same stacked, tilted media, bounce-to-front on
// change, and word-by-word blur-in text. Changes for this portfolio:
// - Tailwind replaced with project CSS (`at-*`); items take any media node, not just an image src
// - rotations are fixed per index (Math.random() would differ between server and client)
// - labelled prev/next buttons (44px), ←/→ keys, and a polite live region announcing the new item
// - only the front item is exposed to assistive tech (and focusable); the stack behind is decorative
// - text swaps with no exit fade, so it never shows the previous item next to the new image
// - under prefers-reduced-motion items swap without tilt, bounce or blur
// - media is windowed: only the front item and its neighbours load (plus any already seen)
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import React, { useCallback, useEffect, useState } from "react";

export interface AnimatedTestimonialItem {
  id: string;
  /** Small label above the title, e.g. "05 / 05". */
  eyebrow?: string;
  title: string;
  /** Animated in word by word. */
  body?: string;
  /**
   * Fills the media frame. `load` is false for items far from the front one that haven't been
   * near it yet: return nothing then (the card shows its plain background) so their media isn't
   * downloaded up front.
   */
  media: (active: boolean, load: boolean) => React.ReactNode;
}

const ROTATIONS = [-6, 4, -3, 7, -8, 2, 5, -4, 8, -2, 3, -7, 6];

export function AnimatedTestimonials({
  items,
  label,
  autoplay = false,
  prevLabel = "Previous",
  nextLabel = "Next",
}: {
  items: AnimatedTestimonialItem[];
  /** Accessible name for the carousel. */
  label: string;
  autoplay?: boolean;
  prevLabel?: string;
  nextLabel?: string;
}) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const n = items.length;

  // Media loads for the front item and its neighbours (so the next step is ready), and stays
  // loaded once it has been near the front.
  const [loaded, setLoaded] = useState(() => new Set([0, 1 % n, (n - 1) % n]));
  useEffect(() => {
    setLoaded((prev) => {
      const near = [active, (active + 1) % n, (active - 1 + n) % n];
      if (near.every((i) => prev.has(i))) return prev;
      return new Set([...prev, ...near]);
    });
  }, [active, n]);

  const next = useCallback(() => setActive((i) => (i + 1) % n), [n]);
  const prev = useCallback(() => setActive((i) => (i - 1 + n) % n), [n]);

  useEffect(() => {
    if (!autoplay || reduce) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [autoplay, reduce, next]);

  const rotate = (i: number) => (reduce ? 0 : ROTATIONS[i % ROTATIONS.length]);
  const item = items[active];

  return (
    <div
      className="at"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); next(); }
        if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      }}
    >
      <div className="at-stage">
        <AnimatePresence>
          {items.map((it, i) => {
            const isActive = i === active;
            return (
              <motion.div
                key={it.id}
                className="at-card"
                // Only the front item is exposed and focusable; the stack behind is decorative.
                aria-hidden={!isActive}
                inert={!isActive}
                initial={{ opacity: 0, scale: 0.9, z: -100, rotate: rotate(i) }}
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  scale: isActive ? 1 : 0.95,
                  z: isActive ? 0 : -100,
                  rotate: isActive ? 0 : rotate(i),
                  zIndex: isActive ? n + 2 : n + 1 - i,
                  y: isActive && !reduce ? [0, -80, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0.9, z: 100, rotate: rotate(i) }}
                transition={{ duration: reduce ? 0 : 0.4, ease: "easeInOut" }}
              >
                {it.media(isActive, loaded.has(i))}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="at-content">
        {/* Announced on change; the animated copy below is visual only. */}
        <div className="at-live" aria-live="polite" aria-atomic="true">
          <article aria-labelledby={`at-title-${item.id}`} aria-describedby={item.body ? `at-body-${item.id}` : undefined}>
            <motion.div
              key={item.id}
              initial={reduce ? false : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {item.eyebrow && <p className="at-eyebrow">{item.eyebrow}</p>}
              <h3 className="at-title" id={`at-title-${item.id}`}>{item.title}</h3>
              {item.body && (
                <p className="at-body" id={`at-body-${item.id}`}>
                  <span className="sr-only">{item.body}</span>
                  <span aria-hidden="true">
                    {item.body.split(" ").map((word, i) => (
                      <motion.span
                        key={i}
                        className="at-word"
                        initial={reduce ? false : { filter: "blur(10px)", opacity: 0, y: 5 }}
                        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut", delay: 0.02 * i }}
                      >
                        {word}&nbsp;
                      </motion.span>
                    ))}
                  </span>
                </p>
              )}
            </motion.div>
          </article>
        </div>

        <div className="at-nav">
          <button type="button" className="at-btn" onClick={prev} aria-label={prevLabel}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className="at-btn" onClick={next} aria-label={nextLabel}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
