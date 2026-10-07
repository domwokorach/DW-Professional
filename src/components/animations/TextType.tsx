'use client';

import { useRef } from 'react';
import { useRevealOnce } from '@/hooks';

type Props = {
  prefix: string;
  emphasis: string;
  /** Target total typing time in seconds; per-character stagger is clamped to 0.025–0.045s. */
  duration?: number;
  className?: string;
  id?: string;
};

// Words stay unbreakable and characters are plain inline spans, so wrapping and
// kerning match the unsplit heading and nothing reflows while it types.
function Chars({ text }: { text: string }) {
  const words = text.split(' ');
  return words.map((word, w) => (
    <span key={w}>
      <span className="tt-word">{[...word].map((c, i) => <span key={i} className="tt-char">{c}</span>)}</span>
      {w < words.length - 1 ? ' ' : null}
    </span>
  ));
}

/** Types an `<h2>` in left to right, once, when it scrolls into view. */
export default function TextType({ prefix, emphasis, duration = 1.2, className, id }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useRevealOnce(
    ref,
    // A CSS animation per character with a staggered delay (no animation library needed).
    (el) => el.classList.add('tt-pending'),
    (el) => {
      const chars = el.querySelectorAll<HTMLElement>('.tt-char');
      const stagger = Math.min(0.045, Math.max(0.025, duration / chars.length));
      chars.forEach((c, i) => { c.style.animationDelay = `${(i * stagger).toFixed(3)}s`; });
      el.classList.replace('tt-pending', 'tt-play');
    },
  );

  return (
    <h2 ref={ref} id={id} className={className}>
      <span className="sr-only">{`${prefix} ${emphasis}`}</span>
      <span aria-hidden="true">
        <Chars text={prefix} />{' '}
        <em><Chars text={emphasis} /></em>
      </span>
    </h2>
  );
}
