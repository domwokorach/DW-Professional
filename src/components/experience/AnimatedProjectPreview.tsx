'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PreviewPlaybackControls from './PreviewPlaybackControls';

export type AnimatedPreviewSources = {
  webm: string;
  mp4: string;
  /** Used only if neither video format can be played. */
  gif: string;
  poster: string;
};

/**
 * Looping engineering-workflow preview. The video is only fetched when it nears the viewport, plays while visible
 * (never for visitors who prefer reduced motion, who see the static poster until they press Play), pauses when
 * scrolled away, and stays paused once the visitor pauses it. The 16:9 box is reserved up front to avoid layout shift.
 */
export default function AnimatedProjectPreview({ sources, alt, width = 1920, height = 1080 }: {
  sources: AnimatedPreviewSources;
  alt: string;
  width?: number;
  height?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    setCanFullscreen(typeof document !== 'undefined' && document.fullscreenEnabled === true);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let loaded = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) { el.pause(); return; }
        if (!loaded) { loaded = true; el.preload = 'auto'; el.load(); }
        if (!reduceMotion.matches && !userPaused.current) el.play().catch(() => undefined);
      },
      { rootMargin: '200px 0px', threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggle = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      userPaused.current = false;
      el.play().catch(() => undefined);
    } else {
      userPaused.current = true;
      el.pause();
    }
  }, []);

  const replay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    userPaused.current = false;
    el.currentTime = 0;
    el.play().catch(() => undefined);
  }, []);

  const fullscreen = useCallback(() => {
    boxRef.current?.requestFullscreen?.().catch(() => undefined);
  }, []);

  return (
    <div className="pv">
      <div ref={boxRef} className="pv-frame" style={{ aspectRatio: `${width} / ${height}` }}>
        {failed ? (
          // eslint-disable-next-line @next/next/no-img-element -- animated GIF fallback; next/image would not preserve the animation
          <img src={sources.gif} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
        ) : (
          <video
            ref={videoRef}
            loop
            muted
            playsInline
            preload="none"
            poster={sources.poster}
            width={width}
            height={height}
            aria-label={alt}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setFailed(true)}
          >
            <source src={sources.webm} type="video/webm" />
            <source src={sources.mp4} type="video/mp4" onError={() => setFailed(true)} />
          </video>
        )}
      </div>
      {!failed && <PreviewPlaybackControls playing={playing} onToggle={toggle} onReplay={replay} onFullscreen={fullscreen} canFullscreen={canFullscreen} />}
    </div>
  );
}
