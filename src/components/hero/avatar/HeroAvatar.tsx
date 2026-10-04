'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery } from '@/composables';
import { media } from '@/config';
import { INTRO_SCRIPT, type AvatarAssets } from './config';
import { useLipSync } from './hooks/useLipSync';

const AvatarCanvas = dynamic(() => import('./AvatarCanvas'), { ssr: false });

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Live 3D talking avatar for the hero (React Three Fiber). Progressive enhancement: it only takes
 * over once the model (`assets`) has loaded cleanly; until then, without WebGL, or if loading
 * fails, the portrait stays. Speech and pointer tracking are independent, so he keeps following
 * the visitor's cursor while he talks.
 */
export default function HeroAvatar({ assets, onActiveChange }: { assets?: AvatarAssets; onActiveChange: (active: boolean) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useMediaQuery(media.reducedMotion);
  const { lipSync, audioRef, speaking, audioEvents } = useLipSync(assets?.lipSync);

  useEffect(() => setEnabled(Boolean(assets) && supportsWebGL()), [assets]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !stage) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(stage);
    return () => io.disconnect();
  }, [enabled]);

  useEffect(() => () => onActiveChange(false), [onActiveChange]);

  const onReady = useCallback(() => {
    setReady(true);
    onActiveChange(true);
  }, [onActiveChange]);

  const onError = useCallback((err: unknown) => {
    console.warn('[HeroAvatar] keeping the portrait:', err);
    lipSync.stop();
    setEnabled(false);
    setReady(false);
    onActiveChange(false);
  }, [lipSync, onActiveChange]);

  const toggleIntro = () => (speaking ? lipSync.stop() : lipSync.start());

  return (
    <>
      <div ref={stageRef} className={`hero-person-frame hero-avatar-stage${ready ? ' is-ready' : ''}`} aria-hidden="true">
        {enabled && assets && (
          <AvatarCanvas assets={assets} lipSync={lipSync} reducedMotion={reducedMotion} visible={visible} onReady={onReady} onError={onError} />
        )}
      </div>
      {enabled && assets?.voice && (
        <audio ref={audioRef} src={assets.voice} preload="auto" {...audioEvents} />
      )}
      {ready && assets?.voice && (
        <>
          <button className="sound-toggle" onClick={toggleIntro} aria-pressed={speaking}>
            {speaking ? '■ Stop intro' : '▶ Play intro'}
          </button>
          <p className="sr-only">{INTRO_SCRIPT}</p>
        </>
      )}
    </>
  );
}
