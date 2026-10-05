'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { HyperText } from '@/components/ui/hyper-text';

const TEXT = 'Click or tap the card to flip';

/**
 * The hint under the ID card. Its letters scramble and resolve (Magic UI Hyper Text) when the card scrolls
 * into view, when the pointer enters the text, and again each time the card is flipped (`replay` changes,
 * which remounts the animation), so it responds to both click and tap. The real sentence stays in the
 * accessibility tree; the animated copy is hidden from it so screen readers never hear scrambled letters.
 * With reduced motion the plain text is shown.
 */
export default function FlipCaption({ replay }: { replay: number }) {
  const prefersReduced = useReducedMotion();
  // The reduced-motion preference is only known in the browser, so honour it after mount: the first
  // client render must match the server's (which animates), or React reports a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted && prefersReduced;
  return (
    <p className="dev-id-caption">
      <span className="sr-only">{TEXT}</span>
      <span aria-hidden="true">
        {reduce ? TEXT : (
          // Before the first flip, wait until it is on screen; after a flip it is, so start straight away.
          <HyperText as="span" key={replay} startOnView={replay === 0} duration={700}>{TEXT}</HyperText>
        )}
      </span>
    </p>
  );
}
