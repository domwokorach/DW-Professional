'use client';
// Ported from Vue Bits "PulseHeart" (https://vue-bits.dev/r/PulseHeart.json), a Vue component, to React with plain CSS
// (this project has no Tailwind). The pulse itself is the original's: on activation the heart shrinks to a dot, the
// liked/unliked state swaps at the bottom of that shrink, then it swells back past its size and settles, while the
// pill behind it gives a small beat. Changes for this portfolio:
// - React instead of Vue; the Tailwind classes became pulse-heart.css (`ph-*`)
// - the heart path is inlined (Lucide's, ISC licence) instead of Hugeicons' package; the like count with its rolling
//   digits and the star / thumb icons are left out (nothing here has a count)
// - the button's name is the action ("Like comment" / "Unlike comment") instead of aria-pressed, as the spec asks
// - the animation also plays for keyboard activation (the original made that instant); reduced motion stays instant
// - the liked state is owned by the parent (controlled), so it survives the parent re-rendering or sliding away
import { useEffect, useRef, useState } from 'react';
import './pulse-heart.css';

const OUT = 0.4; // share of the animation spent shrinking
const back = (k: number, c: number) => {
  const u = k - 1;
  return 1 + (c + 1) * u ** 3 + c * u ** 2;
};
const swellOf = (t: number, c: number) => (t <= 0 ? 0 : t < OUT ? 1 - (1 - t / OUT) ** 3 : 1 - back((t - OUT) / (1 - OUT), c));
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const HEART = 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

type Props = {
  liked: boolean;
  onChange: (liked: boolean) => void;
  /** Heart size in px. */
  size?: number;
  /** Animation length in ms. */
  duration?: number;
  /** How small the heart gets (fraction of its size). */
  dotSize?: number;
  /** How far past its size it swells before settling. */
  overshoot?: number;
  /** How much the pill shrinks on the beat (%). */
  beat?: number;
  likeLabel?: string;
  unlikeLabel?: string;
  className?: string;
};

export default function PulseHeart({
  liked,
  onChange,
  size = 20,
  duration = 560,
  dotSize = 0.3,
  overshoot = 1.7,
  beat = 3,
  likeLabel = 'Like comment',
  unlikeLabel = 'Unlike comment',
  className,
}: Props) {
  const [shown, setShown] = useState(liked); // what is drawn: lags `liked` mid-animation, to swap at the bottom of the shrink
  const likedRef = useRef(liked);
  likedRef.current = liked;
  const running = useRef(false);
  const raf = useRef(0);
  const glyph = useRef<SVGGElement>(null);
  const pill = useRef<HTMLSpanElement>(null);

  useEffect(() => { if (!running.current) setShown(liked); }, [liked]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onClick = () => {
    if (running.current) return;
    const next = !liked;
    onChange(next);
    if (reducedMotion()) { setShown(next); return; }

    running.current = true;
    let swapped = false;
    let prev = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const step = prev ? now - prev : 1000 / 60;
      prev = now;
      const s = swellOf(t, overshoot);
      glyph.current?.setAttribute('transform', `translate(12 12) scale(${1 - (1 - dotSize) * s}) translate(-12 -12)`);
      if (pill.current) pill.current.style.transform = `scale(${1 - (beat / 100) * s})`;
      if (!swapped && t + step / 2 / duration >= OUT) { swapped = true; setShown(next); }
      if (t < 1) { raf.current = requestAnimationFrame(tick); return; }
      glyph.current?.removeAttribute('transform');
      if (pill.current) pill.current.style.transform = '';
      running.current = false;
      setShown(likedRef.current);
    };
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <button
      type="button"
      className={`ph${className ? ` ${className}` : ''}`}
      style={{ '--ph-size': `${size}px` } as React.CSSProperties}
      data-liked={shown}
      aria-label={liked ? unlikeLabel : likeLabel}
      onClick={onClick}
    >
      <span ref={pill} className="ph-pill" aria-hidden="true">
        <span className="ph-heart">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" focusable="false">
            <g ref={glyph}>
              <path d={HEART} vectorEffect="non-scaling-stroke" />
            </g>
          </svg>
        </span>
      </span>
    </button>
  );
}
