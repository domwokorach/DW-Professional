"use client";
// Adapted from Vue Bits "RubberSegment" (https://vue-bits.dev/r/RubberSegment.json), ported from
// Vue + motion-v to React + motion/react. Same thumb motion: on a change the thumb first stretches
// to span old and new item, the leading edge springs onto the target, and the trailing edge
// overshoots by `squash` px before settling. The active labels are a second, aria-hidden copy
// clipped to the thumb, so text colour flips crisply under it. Changes for this portfolio:
// - built for navigation: items are buttons that report a selection; the current item is set from
//   outside (`value`, e.g. scroll position) and the thumb travels whenever it changes
// - no dragging/flicking (not useful in a nav bar), no icons, styles in project CSS (`rs-*`)
// - `aria-current` marks the current item; the thumb is decorative
// - under prefers-reduced-motion the thumb moves without stretch or spring
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export type RubberSegmentItem = { value: string; label: string };

type Slot = { l: number; r: number };

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING_UI = { type: "spring" as const, duration: 0.3, bounce: 0 };
const SPRING_RELAX = { type: "spring" as const, duration: 0.16, bounce: 0 };
const DILATE = 0.19;
const HANDOFF = 0.15;

export function RubberSegment({
  items,
  value,
  onSelect,
  stretch = 100,
  squash = 3,
  className,
  current = "location",
}: {
  items: RubberSegmentItem[];
  value: string;
  onSelect: (value: string) => void;
  /** How far (0–100%) the thumb stretches across the old and new item mid-move. */
  stretch?: number;
  /** Overshoot (px) of the trailing edge before it settles. 0 disables. */
  squash?: number;
  className?: string;
  /** `aria-current` value for the current item. */
  current?: "page" | "location" | "true";
}) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLButtonElement | null)[]>([]);
  const slots = useRef<Slot[]>([]);
  const index = Math.max(0, items.findIndex((i) => i.value === value));
  const committed = useRef(index);
  const gen = useRef(0);
  const handoff = useRef<ReturnType<typeof setTimeout>>(undefined);

  const edgeL = useMotionValue(0);
  const edgeR = useMotionValue(0);
  // Huge until measured, so the clip hides the thumb entirely before the first layout (no flash
  // of a fully filled bar in the server-rendered page); CSS highlights the current item meanwhile.
  const innerW = useMotionValue(1e5);
  const clipPath = useTransform([edgeL, edgeR, innerW], ([l, r, w]: number[]) =>
    `inset(0 ${Math.max(0, w - r)}px 0 ${Math.max(0, l)}px round var(--rs-thumb-radius))`,
  );

  const jumpTo = useCallback((i: number) => {
    const s = slots.current[i];
    if (!s) return;
    clearTimeout(handoff.current);
    gen.current += 1;
    edgeL.jump(s.l);
    edgeR.jump(s.r);
  }, [edgeL, edgeR]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const inset = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    slots.current = items.map((_, i) => {
      const r = itemEls.current[i]?.getBoundingClientRect();
      return r ? { l: r.left - rect.left - inset, r: r.right - rect.left - inset } : { l: 0, r: 0 };
    });
    innerW.set(rect.width - inset * 2);
    jumpTo(committed.current);
    track.dataset.ready = "";
  }, [items, innerW, jumpTo]);

  // Measure before paint, then again on resize and once web fonts settle.
  useLayoutEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return;
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  const land = useCallback((to: number) => {
    const b = slots.current[to];
    if (!b) return;
    const g = ++gen.current;
    const dir = Math.sign((b.l + b.r) / 2 - (edgeL.get() + edgeR.get()) / 2) || 1;
    const [lead, leadTo, trail, trailTo] = dir > 0 ? [edgeR, b.r, edgeL, b.l] : [edgeL, b.l, edgeR, b.r];
    animate(lead, leadTo, SPRING_UI);
    if (squash <= 0) { animate(trail, trailTo, SPRING_UI); return; }
    animate(trail, trailTo + dir * squash, SPRING_UI).then(() => {
      if (gen.current === g) animate(trail, trailTo, SPRING_RELAX);
    });
  }, [edgeL, edgeR, squash]);

  const travel = useCallback((from: number, to: number) => {
    const a = slots.current[from];
    const b = slots.current[to];
    if (!a || !b) return;
    clearTimeout(handoff.current);
    gen.current += 1;
    if (reduce) { edgeL.jump(b.l); edgeR.jump(b.r); return; }
    const u = stretch / 100;
    const tween = { duration: DILATE, ease: EASE_OUT };
    animate(edgeL, b.l + (Math.min(a.l, b.l) - b.l) * u, tween);
    animate(edgeR, b.r + (Math.max(a.r, b.r) - b.r) * u, tween);
    handoff.current = setTimeout(() => land(to), HANDOFF * 1000);
  }, [reduce, stretch, edgeL, edgeR, land]);

  // The current item comes from outside (a click, or the section scrolled into view): travel to it.
  useEffect(() => {
    if (committed.current === index) return;
    const from = committed.current;
    committed.current = index;
    travel(from, index);
  }, [index, travel]);

  useEffect(() => () => {
    clearTimeout(handoff.current);
    edgeL.stop();
    edgeR.stop();
  }, [edgeL, edgeR]);

  return (
    <div ref={trackRef} className={`rs${className ? ` ${className}` : ""}`}>
      {items.map((item, i) => (
        <button
          key={item.value}
          ref={(el) => { itemEls.current[i] = el; }}
          type="button"
          className="rs-item"
          aria-current={i === index ? current : undefined}
          onClick={() => onSelect(item.value)}
        >
          {item.label}
        </button>
      ))}
      <motion.div className="rs-thumb" aria-hidden="true" style={{ clipPath }}>
        {items.map((item) => <span key={item.value} className="rs-item rs-item--ghost">{item.label}</span>)}
      </motion.div>
    </div>
  );
}
