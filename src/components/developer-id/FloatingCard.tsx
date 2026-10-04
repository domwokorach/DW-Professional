'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees around each axis. */
  maxRotateX?: number;
  maxRotateY?: number;
  /** Lift (px) while the pointer is over the card. */
  lift?: number;
  /** Interpolation factor per frame (0–1). Lower is softer. */
  smoothing?: number;
};

/**
 * Pointer-reactive 3D tilt. Children keep their own 3D context, so any
 * descendant with `translateZ` sits at a visible depth while the card tilts.
 * Exposes --sx / --sy (shadow offset, px) for children to drive shadows.
 */
export default function FloatingCard({
  children,
  className = '',
  maxRotateX = 5,
  maxRotateY = 7,
  lift = 4,
  smoothing = 0.12,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const target = { rx: 0, ry: 0, ty: 0 };
    const current = { rx: 0, ry: 0, ty: 0 };
    let frame = 0;

    const render = () => {
      let settled = true;
      for (const k of ['rx', 'ry', 'ty'] as const) {
        current[k] += (target[k] - current[k]) * smoothing;
        if (Math.abs(target[k] - current[k]) > 0.005) settled = false;
        else current[k] = target[k];
      }
      card.style.transform = `translate3d(0, ${current.ty}px, 0) rotateX(${current.rx}deg) rotateY(${current.ry}deg)`;
      card.style.setProperty('--sx', `${(-current.ry * 1.6).toFixed(2)}px`);
      card.style.setProperty('--sy', `${(18 + current.rx * 1.6 - current.ty).toFixed(2)}px`);
      frame = settled ? 0 : requestAnimationFrame(render);
    };
    const kick = () => { if (!frame) frame = requestAnimationFrame(render); };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // keep taps and scrolling calm on touch
      const r = stage.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      target.rx = -ny * maxRotateX;
      target.ry = nx * maxRotateY;
      target.ty = -lift;
      kick();
    };
    const onLeave = () => {
      target.rx = target.ry = target.ty = 0;
      kick();
    };

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, [maxRotateX, maxRotateY, lift, smoothing]);

  return (
    <div ref={stageRef} className={`floating-card-stage ${className}`}>
      <div ref={cardRef} className="floating-card">{children}</div>
    </div>
  );
}
