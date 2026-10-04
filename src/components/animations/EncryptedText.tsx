'use client';

import { useEffect, useState, type ReactNode } from 'react';

const GLYPHS = 'AZ01#%&@X/\\+-';

// Deterministic first frame so server and client render the same scramble.
const initialScramble = (text: string) =>
  [...text].map((c, i) => (c === ' ' ? c : GLYPHS[(i * 7 + 3) % GLYPHS.length])).join('');

type Props = {
  text: string;
  /** ms before the reveal starts */
  delay?: number;
  /** ms from start until the last character resolves */
  duration?: number;
  /** ms between glyph swaps for unresolved characters (higher = less flicker) */
  tick?: number;
  /** Map the (possibly scrambled) string to markup, e.g. to keep a <br/>. */
  render?: (value: string) => ReactNode;
  /** Fired once the text is fully resolved. */
  onDone?: () => void;
};

/**
 * Scrambles `text` and resolves it left to right, once. The real text is laid out
 * invisibly to reserve its exact width, while the animated layer sits on top and
 * is hidden from assistive tech. Screen readers get the final text throughout.
 */
export default function EncryptedText({ text, delay = 0, duration = 1000, tick = 55, render = (v) => v, onDone }: Props) {
  const [value, setValue] = useState(() => initialScramble(text));
  const done = value === text;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(text);
      onDone?.();
      return;
    }
    const chars = [...text];
    const span = duration / chars.length;
    let frame = 0;
    let lastSwap = 0;
    let start = 0;
    let current = chars.map((c, i) => (c === ' ' ? c : initialScramble(text)[i]));

    const step = (now: number) => {
      if (!start) start = now + delay;
      const elapsed = now - start;
      const resolved = elapsed < 0 ? 0 : Math.min(chars.length, Math.floor(elapsed / span) + 1);
      const swap = now - lastSwap >= tick;
      if (swap) lastSwap = now;
      current = chars.map((c, i) => {
        if (i < resolved || c === ' ') return c;
        return swap ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : current[i];
      });
      setValue(current.join(''));
      if (resolved < chars.length) frame = requestAnimationFrame(step);
      else onDone?.();
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delay, duration, tick]);

  if (done) return <>{render(text)}</>;

  return (
    <span className="encrypted-text">
      <span className="sr-only">{text}</span>
      <span className="encrypted-text__ghost" aria-hidden="true">{render(text)}</span>
      <span className="encrypted-text__live" aria-hidden="true">{render(value)}</span>
    </span>
  );
}
