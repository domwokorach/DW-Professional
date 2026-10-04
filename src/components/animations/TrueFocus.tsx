'use client';

import { useRef } from 'react';
import { animate } from 'motion/mini';
import { useRevealOnce } from '@/composables';

type Props = {
  prefix: string;
  emphasis: string;
  /** Put the emphasised word on its own line (as the original markup did with <br/>). */
  breakBeforeEmphasis?: boolean;
  className?: string;
};

const FROM = { filter: 'blur(6px)', opacity: '0.45', transform: 'scale(0.98)' };
const EASE = [0.22, 1, 0.36, 1] as const;

/** Brings each word from soft blur into sharp focus, in order, once. */
export default function TrueFocus({ prefix, emphasis, breakBeforeEmphasis = false, className }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useRevealOnce(
    ref,
    (el) => el.querySelectorAll<HTMLElement>('.tf-word').forEach((w) => Object.assign(w.style, FROM)),
    (el) => {
      const words = [...el.querySelectorAll<HTMLElement>('.tf-word')];
      const controls = words.map((w, i) =>
        animate(
          w,
          { filter: ['blur(6px)', 'blur(0px)'], opacity: [0.45, 1], transform: ['scale(0.98)', 'scale(1)'] },
          { duration: 0.55, delay: i * 0.15, ease: EASE },
        ),
      );
      // Drop inline styles once settled so the heading ends exactly as authored.
      Promise.all(controls).then(() => words.forEach((w) => w.removeAttribute('style')));
      return () => controls.forEach((c) => c.stop());
    },
  );

  return (
    <h2 ref={ref} className={className}>
      <span className="sr-only">{`${prefix} ${emphasis}`}</span>
      <span aria-hidden="true">
        <span className="tf-word">{prefix}</span>
        {breakBeforeEmphasis ? <br /> : ' '}
        <em className="tf-word">{emphasis}</em>
      </span>
    </h2>
  );
}
