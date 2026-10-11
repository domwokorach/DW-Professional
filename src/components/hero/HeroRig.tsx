'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { HERO_RIG_DIR, HERO_RIG_LIMITS, type HeroRigManifest } from '@/config/hero-rig';

type Axis = { x: number; v: number };
const spring = (a: Axis, target: number, k: number, c: number, dt: number) => {
  a.v += (k * (target - a.x) - c * a.v) * dt;
  a.x += a.v * dt;
};
const clamp = (n: number, m = 1) => Math.max(-m, Math.min(m, n));
const url = (m: HeroRigManifest, k: keyof HeroRigManifest['layers']) => `${HERO_RIG_DIR}/${m.layers[k]}`;

/**
 * Layered portrait. The background, body and neck layers are never touched. One requestAnimationFrame loop springs the
 * eyes (fast) and the head group (slower, aimed 80 ms later, so the eyes lead) and writes transforms straight to the
 * DOM, with no React state. `trackArea` (the site header) is the pointer area; touch screens get a slow idle drift
 * with blinks instead, and reduced motion keeps the still pose.
 */
export default function HeroRig({ manifest, trackArea, tracking, still }: { manifest: HeroRigManifest; trackArea: HTMLElement | null; tracking: boolean; still: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<HTMLDivElement>(null);
  const lidsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current, head = headRef.current, eyes = eyesRef.current, lids = lidsRef.current;
    if (!root || !head || !eyes || !lids || still) return;
    const { width, height, pivot, eyeTravel } = manifest;
    const L = HERO_RIG_LIMITS;
    // Pointer → look target in -1…1 (x right, y down).
    const aim = { x: 0, y: 0 }, headAim = { x: 0, y: 0 };
    const ex: Axis = { x: 0, v: 0 }, ey: Axis = { x: 0, v: 0 }, hx: Axis = { x: 0, v: 0 }, hy: Axis = { x: 0, v: 0 };
    let raf = 0, last = 0, visible = true, headTimer = 0, idleAt = 0, nextBlink = performance.now() + 2500, blinkStart = -1, doubleBlink = false;
    let pointerActive = false;

    const setAim = (x: number, y: number) => {
      aim.x = clamp(x); aim.y = clamp(y);
      window.clearTimeout(headTimer);
      headTimer = window.setTimeout(() => { headAim.x = aim.x; headAim.y = aim.y; }, L.headDelay);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !trackArea) return;
      const box = trackArea.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      pointerActive = true;
      setAim((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), ((e.clientY - box.top) / box.height - 0.5) * 2);
    };
    const onLeave = () => { pointerActive = false; setAim(0, 0); };

    const blinkOpacity = (now: number) => {
      if (blinkStart < 0) {
        if (now < nextBlink) return 0;
        blinkStart = now;
        doubleBlink = Math.random() < 0.15;
      }
      const t = (now - blinkStart) / 170;
      if (t >= 1) {
        blinkStart = -1;
        nextBlink = now + (doubleBlink ? 220 : 2600 + Math.random() * 3800);
        doubleBlink = false;
        return 0;
      }
      return Math.sin(Math.PI * t); // down quickly, back up: a closed-lid plate fades in then out
    };

    const frame = (now: number) => {
      raf = visible ? requestAnimationFrame(frame) : 0;
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      if (!tracking || !pointerActive) {
        // Idle: slow drift with a rare glance (touch screens, or the pointer outside the area).
        if (!tracking && now > idleAt) {
          idleAt = now + 1800 + Math.random() * 2600;
          setAim((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.4);
        }
      }
      spring(ex, aim.x, 260, 28, dt); spring(ey, aim.y, 260, 28, dt);
      spring(hx, headAim.x, 70, 13, dt); spring(hy, headAim.y, 70, 13, dt);
      const yaw = hx.x * L.yaw, pitch = -hy.x * L.pitch, roll = hx.x * L.yaw * L.roll;
      head.style.transform = `perspective(1400px) rotateZ(${roll.toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg) rotateX(${pitch.toFixed(3)}deg)`;
      eyes.style.transform = `translate3d(${((ex.x * eyeTravel.x) / width * 100).toFixed(4)}%,${((ey.x * eyeTravel.y) / height * 100).toFixed(4)}%,0)`;
      lids.style.opacity = blinkOpacity(now).toFixed(3);
    };
    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting && !document.hidden; if (visible) start(); });
    io.observe(root);
    const onVis = () => { visible = !document.hidden; if (visible) start(); };
    document.addEventListener('visibilitychange', onVis);
    if (tracking && trackArea) {
      trackArea.addEventListener('pointermove', onMove, { passive: true });
      trackArea.addEventListener('pointerleave', onLeave);
      window.addEventListener('blur', onLeave);
    }
    start();
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(headTimer); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      trackArea?.removeEventListener('pointermove', onMove);
      trackArea?.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      head.style.transform = eyes.style.transform = ''; lids.style.opacity = '';
    };
  }, [manifest, trackArea, tracking, still]);

  const { width, height, pivot } = manifest;
  const layer = (k: keyof HeroRigManifest['layers'], priority = false) => (
    <Image src={url(manifest, k)} alt="" fill sizes="(max-width: 720px) 60vw, (max-width: 1050px) 45vw, 30vw" priority={priority} />
  );
  return (
    <div ref={rootRef} className="hero-rig" style={{ ['--rig-ratio' as string]: String(width / height) }} aria-hidden="true">
      <div className="hero-rig__layer">{layer('background', true)}</div>
      <div className="hero-rig__layer">{layer('body', true)}</div>
      <div className="hero-rig__layer">{layer('neck', true)}</div>
      <div ref={headRef} className="hero-rig__layer hero-rig__head" style={{ transformOrigin: `${(pivot.x / width) * 100}% ${(pivot.y / height) * 100}%` }}>
        <div ref={eyesRef} className="hero-rig__layer">{layer('eyes', true)}</div>
        <div className="hero-rig__layer">{layer('head', true)}</div>
        <div ref={lidsRef} className="hero-rig__layer hero-rig__lids">{layer('eyelids', true)}</div>
      </div>
    </div>
  );
}
