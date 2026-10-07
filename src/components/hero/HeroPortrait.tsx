'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks';
import { HERO_BODY, HERO_HEADS, HERO_LOOK_FADE, HERO_LOOK_ZONES, heroAlt, media, type HeroLook } from '@/config';
// Loaded only when a valid avatar model exists: its lip-sync code pulls in three.js, which
// would otherwise land in every visitor's initial bundle.
const HeroAvatar = dynamic(() => import('./avatar/HeroAvatar'), { ssr: false });
import type { AvatarAssets } from './avatar/config';

const HERO_SIZES = '(max-width: 720px) 60vw, (max-width: 1050px) 45vw, 30vw';
/** The head box is 52% of the body's width. */
const HEAD_SIZES = '(max-width: 720px) 32vw, (max-width: 1050px) 24vw, 16vw';
const HEADS = Object.keys(HERO_HEADS) as Exclude<HeroLook, 'centre'>[];
const COLS = ['Left', '', 'Right'] as const;

/** Picks the direction for a pointer at (x, y) in the hero (0…1 each way), with the character's centre at `cx`. */
function pickLook(x: number, y: number, cx: number, current: HeroLook): HeroLook {
  const { centre, up, down, hysteresis: h } = HERO_LOOK_ZONES;
  const wasUp = current.startsWith('up');
  const wasDown = current.startsWith('down');
  const wasCentreCol = !/left|right/i.test(current);
  const dx = x - cx;
  const band = wasCentreCol ? centre + h : centre - h;
  const col = Math.abs(dx) <= band ? 1 : dx < 0 ? 0 : 2;
  const row = y < (wasUp ? up + h : up - h) ? 'up' : y > (wasDown ? down - h : down + h) ? 'down' : '';
  if (!row) return col === 1 ? 'centre' : col === 0 ? 'left' : 'right';
  return (col === 1 ? row : row + COLS[col]) as HeroLook;
}

/** Ease for the crossfade: soft start and finish. */
const ease = (p: number) => p * p * (3 - 2 * p);

/**
 * The hero character, whose head turns toward the pointer anywhere in the hero. The body is one static image that
 * never moves; only the head box above it changes. The other directions are head crops stacked in that box behind a
 * mask (solid over the head, fading out over the collar and shoulders, where every crop matches the body), and only
 * their opacity animates: the incoming head fades in on top of the current one; going back to centre fades the heads
 * out to reveal the body render's own head. So the character never goes see-through and nothing shifts.
 *
 * Pointer moves only store a target; one requestAnimationFrame loop eases the opacities and writes them straight to
 * the DOM (no React state per move), and stops once everything is at rest. Tracking starts only once every head has
 * loaded and decoded, so a change never shows a blank or half-drawn image. Touch screens and reduced motion keep the
 * forward head and never download the others. The live 3D avatar (HeroAvatar) takes over once its model has loaded.
 */
export default function HeroPortrait({ avatar }: { avatar?: AvatarAssets }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const decoded = useRef(new Set<number>());
  const [ready, setReady] = useState(false);
  const [avatarActive, setAvatarActive] = useState(false);
  const reducedMotion = useMediaQuery(media.reducedMotion);
  const finePointer = useMediaQuery(media.finePointer);
  const tracking = finePointer && !reducedMotion && !avatarActive;

  // Only the body is needed to paint the hero. The heads are only ever shown to a mouse (never on touch or under
  // reduced motion), so they load once the page has loaded, without competing with the hero image.
  const [heads, setHeads] = useState(false);
  useEffect(() => {
    if (!tracking || heads) return;
    const start = () => setHeads(true);
    if (document.readyState === 'complete') { start(); return; }
    window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, [tracking, heads]);

  const onHeadLoad = (i: number, el: HTMLImageElement) => {
    el.decode().catch(() => {}).then(() => {
      decoded.current.add(i);
      if (decoded.current.size === HEADS.length) setReady(true);
    });
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const hero = wrap?.closest<HTMLElement>('.hero');
    const layers = layerRefs.current;
    if (!tracking || !ready || !wrap || !hero || HEADS.some((_, i) => !layers[i])) return;

    const CENTRE = -1;
    let look: HeroLook = 'centre';
    /** The head being shown (CENTRE: the body's own head), fade progress per head, and their stacking, bottom first. */
    let target = CENTRE;
    const progress = HEADS.map(() => 0);
    const stack = HEADS.map((_, i) => i);
    let raf = 0;
    let last = 0;

    const paint = () => stack.forEach((i, z) => {
      const el = layers[i]!;
      el.style.zIndex = String(z + 1);
      el.style.opacity = String(ease(progress[i]));
    });
    const fadeOut = (list: number[], step: number) => {
      let moving = false;
      for (const i of list) {
        progress[i] = Math.max(0, progress[i] - step);
        if (progress[i] > 0) moving = true;
      }
      return moving;
    };
    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      const step = dt / HERO_LOOK_FADE;
      let moving: boolean;
      const top = stack.indexOf(target);
      if (target === CENTRE) {
        // Back to centre: fade every head out to reveal the body's own head.
        moving = fadeOut(stack, step);
      } else if (top === stack.length - 1) {
        // The target is on top: fade it in; once it is fully shown, the heads under it can be hidden.
        progress[target] = Math.min(1, progress[target] + step);
        moving = progress[target] < 1;
        if (!moving) stack.forEach((i) => { if (i !== target) progress[i] = 0; });
      } else {
        // The target is fully shown under other heads: fade those out, then move it to the top.
        moving = fadeOut(stack.slice(top + 1), step);
        if (!moving) {
          stack.splice(top, 1);
          stack.push(target);
          stack.forEach((i) => { if (i !== target) progress[i] = 0; });
        }
      }
      paint();
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const run = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const setLook = (next: HeroLook) => {
      if (next === look) return;
      look = next;
      target = next === 'centre' ? CENTRE : HEADS.indexOf(next);
      // A head that is still fully shown under others stays in place while they fade out; otherwise it goes on top
      // and fades in.
      if (target !== CENTRE && progress[target] < 1) {
        stack.splice(stack.indexOf(target), 1);
        stack.push(target);
      }
      run();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const box = hero.getBoundingClientRect();
      const char = wrap.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width;
      const y = (e.clientY - box.top) / box.height;
      const cx = (char.left + char.width / 2 - box.left) / box.width;
      setLook(pickLook(x, y, cx, look));
    };
    const rest = () => setLook('centre');

    paint();
    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', rest);
    window.addEventListener('blur', rest);
    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', rest);
      window.removeEventListener('blur', rest);
      for (const el of layers) if (el) el.style.opacity = el.style.zIndex = '';
    };
  }, [tracking, ready]);

  return (
    <div ref={wrapRef} className={`hero-portrait-wrap${avatarActive ? ' has-avatar' : ''}`}>
      <div className="hero-person-frame hero-poses">
        <div className="hero-figure">
          <Image src={HERO_BODY} alt={heroAlt} fill sizes={HERO_SIZES} priority className="hero-portrait" />
          {heads && (
            <div className="hero-head" aria-hidden="true">
              {HEADS.map((name, i) => (
                <div key={name} ref={(el) => { layerRefs.current[i] = el; }} className="hero-head__look">
                  <Image src={HERO_HEADS[name]} alt="" fill sizes={HEAD_SIZES} loading="eager" onLoad={(e) => onHeadLoad(i, e.currentTarget)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {avatar && <HeroAvatar assets={avatar} onActiveChange={setAvatarActive} />}
    </div>
  );
}
