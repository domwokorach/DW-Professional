'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks';
import { HERO_BODY, HERO_HEAD_CENTRE, HERO_HEADS, HERO_LOOK_FADE, HERO_LOOK_ZONES, heroAlt, media, type HeroLook } from '@/config';
// Loaded only when a valid avatar model exists: its lip-sync code pulls in three.js, which
// would otherwise land in every visitor's initial bundle.
const HeroAvatar = dynamic(() => import('./avatar/HeroAvatar'), { ssr: false });
import type { AvatarAssets } from './avatar/config';
import HeroRig from './HeroRig';
import { HERO_RIG_DIR, isHeroRigManifest, type HeroRigManifest } from '@/config/hero-rig';

const HERO_SIZES = '(max-width: 720px) 60vw, (max-width: 1050px) 45vw, 30vw';
/** The head box is 52% of the body's width. */
const HEAD_SIZES = '(max-width: 720px) 32vw, (max-width: 1050px) 24vw, 16vw';
const HEADS = Object.keys(HERO_HEADS) as Exclude<HeroLook, 'centre'>[];
/** Layer index of the body render's own head, kept after the turned heads. */
const CENTRE = HEADS.length;
/** The eight directions in 45° sectors, clockwise from pointing right (screen y runs down). */
const SECTORS: HeroLook[] = ['right', 'downRight', 'down', 'downLeft', 'left', 'upLeft', 'up', 'upRight'];

/** Picks the direction for a pointer at (x, y), each normalised to -1…1 around the viewport centre. */
function pickLook(x: number, y: number, current: HeroLook): HeroLook {
  const { deadZone, hysteresis, angleHysteresis } = HERO_LOOK_ZONES;
  if (Math.hypot(x, y) < (current === 'centre' ? deadZone + hysteresis : deadZone - hysteresis)) return 'centre';
  const angle = (Math.atan2(y, x) * 180) / Math.PI;
  const held = SECTORS.indexOf(current);
  if (held >= 0) {
    const off = Math.abs(((angle - held * 45 + 540) % 360) - 180);
    if (off <= 22.5 + angleHysteresis) return current;
  }
  return SECTORS[(Math.round(angle / 45) + 8) % 8];
}

/** Ease for the crossfade: soft start and finish. */
const ease = (p: number) => p * p * (3 - 2 * p);

/**
 * The hero character, whose head turns toward the pointer anywhere in the viewport. The body is one static image that
 * never moves; only the head box above it changes. The other directions are head crops stacked in that box behind a
 * mask (solid over the head, fading out over the collar and shoulders, where every crop matches the body), and only
 * their opacity animates: the incoming head fades in on top of the current one; going back to centre fades the heads
 * out to reveal the body render's own head. So the character never goes see-through and nothing shifts.
 *
 * Pointer moves only store a target; one requestAnimationFrame loop eases the opacities and writes them straight to
 * the DOM (no React state per move), and stops once everything is at rest. Heads preload on mount; tracking starts only once every head has
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
  const [rig, setRig] = useState<HeroRigManifest | null>(null);
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const tracking = finePointer && !reducedMotion && !avatarActive && !rig;

  // Layered rig (public/hero-rig): used only when its manifest is valid and every layer has loaded and decoded;
  // otherwise the crossfaded head crops above stay in place unchanged.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${HERO_RIG_DIR}/manifest.json`, { cache: 'no-cache' });
        if (!res.ok) return;
        const manifest: unknown = await res.json();
        if (!isHeroRigManifest(manifest)) return;
        await Promise.all(Object.values(manifest.layers).map(async (file) => {
          const img = new window.Image();
          img.src = `${HERO_RIG_DIR}/${file}`;
          await img.decode();
        }));
        if (cancelled) return;
        setHeader(document.querySelector<HTMLElement>('.site-header'));
        setRig(manifest);
      } catch { /* no rig assets: keep the existing portrait */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // The heads are only ever shown to a mouse (never on touch or under reduced motion), so only then are they
  // loaded; all of them load as soon as the hero mounts, so the first pointer move never waits on the network.
  const heads = tracking;

  const onHeadLoad = (i: number, el: HTMLImageElement) => {
    el.decode().catch(() => {}).then(() => {
      decoded.current.add(i);
      if (decoded.current.size === HEADS.length) setReady(true);
    });
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const layers = layerRefs.current;
    if (!tracking || !ready || !wrap || HEADS.some((_, i) => !layers[i])) return;

    let look: HeroLook = 'centre';
    /** The head being shown (CENTRE: the body's own head), fade progress per head, and their stacking, bottom first. */
    let target = CENTRE;
    const progress = [...HEADS.map(() => 0), 1];
    const stack = [...HEADS.map((_, i) => i), CENTRE];
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
      if (top === stack.length - 1) {
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
      if (progress[target] < 1) {
        stack.splice(stack.indexOf(target), 1);
        stack.push(target);
      }
      run();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      // Over a nav link the head looks at that link (from the head's own centre), not just at the pointer.
      const link = e.target instanceof Element ? e.target.closest('.nav-pill button, .nav-pill a') : null;
      const head = wrap.querySelector('.hero-head');
      if (link && head) {
        const a = link.getBoundingClientRect();
        const h = head.getBoundingClientRect();
        setLook(pickLook((a.left + a.width / 2 - (h.left + h.width / 2)) / (window.innerWidth / 2), (a.top + a.height / 2 - (h.top + h.height / 2)) / (window.innerHeight / 2), look));
        return;
      }
      setLook(pickLook((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1, look));
    };
    const rest = () => setLook('centre');

    paint();
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', rest);
    window.addEventListener('blur', rest);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', rest);
      window.removeEventListener('blur', rest);
      for (const el of layers) if (el) el.style.opacity = el.style.zIndex = '';
    };
  }, [tracking, ready]);

  return (
    <div ref={wrapRef} className={`hero-portrait-wrap${avatarActive ? ' has-avatar' : ''}`}>
      <div className="hero-person-frame hero-poses">
        {rig ? <HeroRig manifest={rig} trackArea={header} tracking={finePointer} still={reducedMotion} /> : (
        <div className="hero-figure">
          <Image src={HERO_BODY} alt={heroAlt} fill sizes={HERO_SIZES} quality={85} priority className="hero-portrait" />
          <div className="hero-head" aria-hidden="true">
            <div ref={(el) => { layerRefs.current[CENTRE] = el; }} className="hero-head__look hero-head__look--centre">
              <Image src={HERO_HEAD_CENTRE} alt="" fill sizes={HEAD_SIZES} quality={85} priority />
            </div>
            {heads && (
              <>
              {HEADS.map((name, i) => (
                <div key={name} ref={(el) => { layerRefs.current[i] = el; }} className="hero-head__look">
                  <Image src={HERO_HEADS[name]} alt="" fill sizes={HEAD_SIZES} quality={85} loading="eager" onLoad={(e) => onHeadLoad(i, e.currentTarget)} />
                </div>
              ))}
              </>
            )}
          </div>
        </div>
        )}
      </div>
      {avatar && <HeroAvatar assets={avatar} onActiveChange={setAvatarActive} />}
    </div>
  );
}
