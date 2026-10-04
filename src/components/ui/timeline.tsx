"use client";
// Adapted from Aceternity UI "timeline" (https://ui.aceternity.com/registry/timeline.json).
// Same scroll-linked progress line and sticky titles; changes for this portfolio:
// - Tailwind classes replaced with project CSS (`tl-*` in globals.css), demo heading removed
// - semantic <ol>/<li>; `title` accepts markup (for <time>/badges); items take an `id` key
// - 3-column rows (date | rail | content); the line sits in the centre of the rail column
// - line height tracks content via ResizeObserver (e.g. when a panel expands)
// - progress line is hidden under prefers-reduced-motion
// - entries reveal once on scroll (opacity/translate), only after JS runs
import {
  useReducedMotion,
  useScroll,
  useTransform,
  motion,
} from "motion/react";
import React, { useEffect, useRef, useState } from "react";

export interface TimelineEntry {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLOListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [reveal, setReveal] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    setReveal(true);
    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e, i) => {
        const item = e.target as HTMLElement;
        item.style.transitionDelay = `${i * 80}ms`;
        item.classList.add("is-visible");
        io.unobserve(item);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    el.querySelectorAll(".tl-item").forEach((item) => io.observe(item));
    return () => io.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="tl" ref={containerRef}>
      <ol ref={ref} className={`tl-list${reveal ? " tl-reveal" : ""}`}>
        {data.map((item) => (
          <li key={item.id} className={`tl-item${item.className ? ` ${item.className}` : ""}`}>
            {/* Date + rail stick as one unit (subgrid), so the dot can't drift from its date. */}
            <div className="tl-head">
              <div className="tl-title tl-title--desktop">{item.title}</div>
              <div className="tl-rail" aria-hidden="true">
                <span className="tl-dot" />
              </div>
            </div>

            <div className="tl-body">
              <div className="tl-title tl-title--mobile">{item.title}</div>
              {item.content}
            </div>
          </li>
        ))}
      </ol>
      <div className="tl-line" style={{ height: height + "px" }} aria-hidden="true">
        {!reduceMotion && (
          <motion.div
            className="tl-line__progress"
            style={{ height: heightTransform, opacity: opacityTransform }}
          />
        )}
      </div>
    </div>
  );
};
