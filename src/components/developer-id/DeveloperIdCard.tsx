'use client';

import Image from 'next/image';
import { encode } from 'uqr';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { PORTFOLIO_ACCESS_URL } from '@/config';
import DeveloperIdEvervault, { useEvervaultPointer } from './DeveloperIdEvervault';
import FloatingCard from './FloatingCard';
import FlipCaption from './FlipCaption';

const HERO_TEXT_SETTLED_MS = 1500;

const SKILLS = ['React', 'Next.js', 'Vue', 'TypeScript', 'Node.js', 'Python', 'AI', 'Data'];

// Small seeded PRNG so the barcode and QR pattern render identically on server and client.
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function Barcode({ value }: { value: string }) {
  const { bars, width } = useMemo(() => {
    const rand = seeded(value);
    const out: { x: number; w: number }[] = [];
    // Guard bars, a run of variable-width data bars, guard bars.
    let x = 0;
    const push = (w: number, gap: number) => { out.push({ x, w }); x += w + gap; };
    push(1, 1); push(1, 1);
    for (let i = 0; i < 46; i++) push(1 + Math.floor(rand() * 3), 1 + Math.floor(rand() * 2));
    push(1, 1); push(1, 0);
    return { bars: out, width: x };
  }, [value]);

  return (
    <div className="dev-id__barcode">
      <svg viewBox={`0 0 ${width} 10`} preserveAspectRatio="none" aria-hidden="true">
        {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={10} />)}
      </svg>
      <span>*{value.replace(/-/g, '')}*</span>
    </div>
  );
}

// A real, scannable QR code (not a decorative pattern): it opens the Portfolio Access page, which
// hands the visitor the CV. Deterministic, so server and client render the same SVG.
function QrBlock({ value }: { value: string }) {
  const { size, cells } = useMemo(() => {
    const { size, data } = encode(value, { ecc: 'L', boostEcc: false });
    const out: [number, number][] = [];
    data.forEach((row, r) => row.forEach((on, c) => { if (on) out.push([r, c]); }));
    return { size, cells: out };
  }, [value]);

  // Four modules of quiet zone around the code, as the QR spec asks, so cameras lock on reliably.
  const q = 4;
  return (
    <svg className="dev-id__qr" viewBox={`${-q} ${-q} ${size + q * 2} ${size + q * 2}`} shapeRendering="crispEdges" role="img" aria-label="QR code that opens DOMINIC's portfolio access page">
      <rect x={-q} y={-q} width={size + q * 2} height={size + q * 2} className="dev-id__qr-bg" />
      {cells.map(([r, c]) => <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} />)}
    </svg>
  );
}

type Props = {
  /** Also flip on mouse hover (fine pointers only). Click/tap/keyboard always work. */
  flipOnHover?: boolean;
};

export default function DeveloperIdCard({ flipOnHover = false }: Props) {
  const [flipped, setFlipped] = useState(false);
  // Counts flips so the caption's text animation replays each time the card turns.
  const [flips, setFlips] = useState(0);
  const evervault = useEvervaultPointer();
  // idle → pending (hidden, waiting to be seen) → enter (dropping) → idle
  const [entrance, setEntrance] = useState<'idle' | 'pending' | 'enter'>('idle');
  const entranceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = entranceRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;
    setEntrance('pending');
    let timer = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect(); // play once, never replay on scroll
      // Let the hero's encrypted text (~1.4s) finish before the badge drops.
      const wait = Math.max(0, HERO_TEXT_SETTLED_MS - performance.now());
      timer = window.setTimeout(() => requestAnimationFrame(() => setEntrance('enter')), wait);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); };
  }, []);

  const toggle = () => { setFlipped((f) => !f); setFlips((n) => n + 1); };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  };
  const hover = (next: boolean) => (e: PointerEvent<HTMLDivElement>) => {
    if (flipOnHover && e.pointerType === 'mouse') { setFlipped(next); setFlips((n) => n + 1); }
  };

  return (
    <div className="dev-id-wrap">
      <div
        ref={entranceRef}
        className={`dev-id-entrance${entrance === 'idle' ? '' : ` is-${entrance}`}`}
        onAnimationEnd={(e) => { if (e.target === e.currentTarget) setEntrance('idle'); }}
      >
      <div className="lanyard"><span /></div>
      {/* Presentation layers: a soft surface shadow behind the card, and an elevation wrapper that
          owns only the hover lift (the tilt, flip and drop-in keep their own transform layers). */}
      <div className="dev-id-surface">
      <div className="dev-id-shadow" aria-hidden="true" />
      <div className="dev-id-elevation">
      <FloatingCard className="dev-id-stage">
      <div
        className={`dev-id${flipped ? ' is-flipped' : ''}`}
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? 'Developer ID card, back side. Activate to show the front.' : 'Developer ID card, front side. Activate to show the back.'}
        onClick={toggle}
        onKeyDown={onKeyDown}
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
        onPointerMove={evervault.onPointerMove}
      >
        <div className="dev-id__inner">
          {/* Front */}
          <div className="dev-id__face dev-id__front" aria-hidden={flipped}>
            <DeveloperIdEvervault pointer={evervault} />
            <header className="dev-id__head dev-id__layer" style={{ '--z': '8px' } as CSSProperties}>
              <b>DO</b>
              <span>DEVELOPER ID<small>Portfolio · 2026</small></span>
              <i className="dev-id__chip" aria-hidden="true" />
            </header>
            <div className="dev-id__photo dev-id__layer" style={{ '--z': '22px' } as CSSProperties}>
              <Image src="https://res.cloudinary.com/dkkuwmr42/image/upload/v1791023538/Full%20Stack%20Developer/dominic_zw1v8s_ngyl5d.png" alt="DOMINIC" fill sizes="110px" />
            </div>
            <div className="dev-id__layer" style={{ '--z': '12px' } as CSSProperties}>
              <h3 className="dev-id__name">DOMINIC</h3>
              <p className="dev-id__role">Software Engineer &amp; Frontend Developer.</p>
            </div>
            <dl className="dev-id__details">
              <div><dt>ID NO.</dt><dd>DO-0001</dd></div>
              <div><dt>DEPT.</dt><dd>Engineering</dd></div>
              <div><dt>VALID TILL</dt><dd>2027</dd></div>
            </dl>
            <Barcode value="DO-0001-2027" />
          </div>

          {/* Back */}
          <div className="dev-id__face dev-id__back" aria-hidden={!flipped}>
            <DeveloperIdEvervault pointer={evervault} mirror />
            <header className="dev-id__back-head">
              <span>DEVELOPER PROFILE</span>
              <b>DO</b>
            </header>
            <h3 className="dev-id__back-name">DOMINIC</h3>
            <p className="dev-id__back-role">SOFTWARE ENGINEER &amp; FRONTEND DEVELOPER.</p>
            <p className="dev-id__bio">
              I build responsive web applications, interactive digital experiences, and AI-powered platforms.
            </p>
            <ul className="dev-id__skills">
              {SKILLS.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <div className="dev-id__access">
              <dl>
                <dt>PORTFOLIO ACCESS</dt>
                <dd><span className="dev-id__dot" />STATUS: ACTIVE</dd>
                <dd>ID: DO-0001</dd>
              </dl>
              <QrBlock value={PORTFOLIO_ACCESS_URL} />
            </div>
            <p className="dev-id__hint">Tap to return</p>
          </div>
        </div>
      </div>
      </FloatingCard>
      </div>
      </div>
      </div>
      <FlipCaption replay={flips} />
    </div>
  );
}
