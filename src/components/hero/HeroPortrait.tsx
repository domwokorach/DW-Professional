'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePointerDirection, useMediaQuery } from '@/composables';
import { HERO_POSE_FADE, HERO_POSES, heroAlt, media, type HeroDirection } from '@/config';
// Loaded only when a valid avatar model exists: its lip-sync code pulls in three.js, which
// would otherwise land in every visitor's initial bundle.
const HeroAvatar = dynamic(() => import('./avatar/HeroAvatar'), { ssr: false });
import type { AvatarAssets } from './avatar/config';

const HERO_SIZES = '(max-width: 720px) 60vw, (max-width: 1050px) 45vw, 30vw';
/** One layer per distinct image (lower-left and left share a render). */
const LAYERS = [...new Set(Object.values(HERO_POSES))];

/**
 * The hero character. The poses are stacked in the same box; the pose
 * facing the pointer fades in on top while the previous one stays fully opaque underneath, so the character never
 * turns see-through mid-switch. The live 3D avatar (HeroAvatar) takes over once its model has loaded.
 */
export default function HeroPortrait({ avatar }: { avatar?: AvatarAssets }) {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shown = useRef(LAYERS.indexOf(HERO_POSES.neutral));
  const hideTimer = useRef(0);
  /** Layers whose image has loaded; the character only turns to a pose that is ready to show. */
  const loaded = useRef(new Set<number>([LAYERS.indexOf(HERO_POSES.neutral)]));
  const [avatarActive, setAvatarActive] = useState(false);
  const reducedMotion = useMediaQuery(media.reducedMotion);
  const finePointer = useMediaQuery(media.finePointer);

  const showPose = useCallback((dir: HeroDirection) => {
    const next = LAYERS.indexOf(HERO_POSES[dir]);
    const prev = shown.current;
    if (next === prev || !loaded.current.has(next)) return;
    shown.current = next;
    window.clearTimeout(hideTimer.current);
    layerRefs.current.forEach((el, i) => {
      if (!el) return;
      el.classList.toggle('is-active', i === next);
      el.classList.toggle('is-behind', i === prev);
    });
    hideTimer.current = window.setTimeout(() => layerRefs.current[prev]?.classList.remove('is-behind'), HERO_POSE_FADE);
  }, []);
  const tracking = finePointer && !reducedMotion && !avatarActive;
  usePointerDirection(tracking, showPose);

  // Only the neutral pose is needed to paint the hero. The other poses are only ever shown when a
  // mouse moves (never on touch or under reduced motion), so they load once the page has loaded,
  // without competing with the hero image, and never on devices that can't show them.
  const [extraPoses, setExtraPoses] = useState(false);
  useEffect(() => {
    if (!tracking || extraPoses) return;
    const start = () => setExtraPoses(true);
    if (document.readyState === 'complete') { start(); return; }
    window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, [tracking, extraPoses]);

  return (
    <div className={`hero-portrait-wrap${avatarActive ? ' has-avatar' : ''}`}>
      <div className="hero-person-frame hero-poses" style={{ '--pose-fade': `${HERO_POSE_FADE}ms` } as React.CSSProperties}>
        {LAYERS.map((src, i) => {
          const neutral = src === HERO_POSES.neutral;
          if (!neutral && !extraPoses) return null;
          return (
            <div key={src} ref={(el) => { layerRefs.current[i] = el; }} className={`hero-pose${neutral ? ' is-active' : ''}`} aria-hidden={!neutral}>
              <Image src={src} alt={neutral ? heroAlt : ''} fill sizes={HERO_SIZES} priority={neutral} loading={neutral ? undefined : 'eager'} className="hero-portrait" onLoad={() => loaded.current.add(i)} />
            </div>
          );
        })}
      </div>
      {avatar && <HeroAvatar assets={avatar} onActiveChange={setAvatarActive} />}
    </div>
  );
}
