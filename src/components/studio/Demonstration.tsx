'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VARIANTS, type Variant } from './data';

const defaultFacts = (v: Variant): [string, string][] => [
  ['Nib width', `${v.nibMm} mm`],
  ['Line on paper', `${v.lineMm} mm`],
  ['Ink flow', v.flow],
];

/** The product's own output: one SVG path that draws itself on entry; the picker changes that same path. */
export default function Demonstration({
  variants = VARIANTS,
  group = 'Nib width',
  facts,
}: {
  variants?: Variant[];
  group?: string;
  /** Three label/value pairs printed beneath the drawing for the selected variant. */
  facts?: (v: Variant) => [string, string][];
}) {
  const [active, setActive] = useState(variants[Math.min(1, variants.length - 1)].id);
  const [seen, setSeen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const motion = useRef(false);
  const variant = variants.find((v) => v.id === active) ?? variants[0];
  const rows = (facts ?? defaultFacts)(variant);

  useEffect(() => {
    motion.current = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = panel.current;
    if (!el || !motion.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Hide the line before paint, then draw it once the panel is in view and again whenever the variant changes.
  useLayoutEffect(() => {
    const p = path.current;
    if (!p || !motion.current) return;
    const len = p.getTotalLength();
    p.style.transition = 'none';
    p.style.strokeDasharray = String(len);
    p.style.strokeDashoffset = String(len);
    if (!seen) return;
    p.getBoundingClientRect(); // commit the hidden state so the transition runs
    p.style.transition = 'stroke-dashoffset 2s cubic-bezier(.65,0,.35,1)';
    p.style.strokeDashoffset = '0';
  }, [active, seen]);

  return (
    <>
      <div className="variant-row" role="group" aria-label={group}>
        {variants.map((v) => (
          <button key={v.id} type="button" className="variant-btn" aria-pressed={v.id === active} onClick={() => setActive(v.id)}>
            {v.label}
          </button>
        ))}
      </div>
      <div className="demo-panel" ref={panel}>
        <svg viewBox="0 0 600 200" role="img" aria-label={`Line drawn at ${variant.label.toLowerCase()} weight`}>
          <path ref={path} d={variant.d} fill="none" stroke="currentColor" strokeWidth={variant.stroke} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <dl className="demo-facts" aria-live="polite">
        {rows.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
    </>
  );
}
