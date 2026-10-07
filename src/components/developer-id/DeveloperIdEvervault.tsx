'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { CardPattern, generateRandomString } from '@/components/ui/evervault-card';

const CHARS = 1500;
const REFRESH_MS = 70; // throttle the character shuffle instead of re-rendering on every move

/** Pointer state for the Evervault effect, tracked only while the pointer is over the card. */
export function useEvervaultPointer() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const pulse = useMotionValue(0);

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch') return; // no hover on touch; keep taps for the flip
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
    pulse.set(pulse.get() + 1);
  };

  return { mouseX, mouseY, pulse, onPointerMove };
}

type Pointer = ReturnType<typeof useEvervaultPointer>;

/**
 * Decorative Evervault layer for one face of the Developer ID. Sits behind the face's content
 * (z-index -1), ignores pointer events, is hidden from assistive tech, and is invisible until
 * hovered (see .dev-id-evervault in styles/developer-id.css). `mirror` flips the x axis for
 * the back face, which is rotated 180°.
 */
export default function DeveloperIdEvervault({ pointer, mirror = false }: { pointer: Pointer; mirror?: boolean }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [randomString, setRandomString] = useState('');
  const lastRefresh = useRef(0);
  const mirroredX = useTransform(pointer.mouseX, (x) => (ref.current?.offsetWidth ?? 0) - x);

  useEffect(() => { setRandomString(generateRandomString(CHARS)); }, []);
  useMotionValueEvent(pointer.pulse, 'change', () => {
    const now = performance.now();
    if (now - lastRefresh.current < REFRESH_MS) return;
    lastRefresh.current = now;
    setRandomString(generateRandomString(CHARS));
  });

  if (reduceMotion) return null;

  return (
    <div ref={ref} className="dev-id-evervault" aria-hidden="true">
      <CardPattern mouseX={(mirror ? mirroredX : pointer.mouseX) as MotionValue<number>} mouseY={pointer.mouseY} randomString={randomString} />
    </div>
  );
}
