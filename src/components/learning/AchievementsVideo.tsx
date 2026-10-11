'use client';

import { useEffect, useRef, useState } from 'react';

const VIDEO_SRC = 'https://res.cloudinary.com/dkkuwmr42/video/upload/q_auto,f_auto/v1791742538/london-walking_jer4pf.mp4';
const VIDEO_FALLBACK = 'https://res.cloudinary.com/dkkuwmr42/video/upload/v1791742538/london-walking_jer4pf.mp4';

/** Decorative cinematic background for the achievements section, with a pause/play control. */
export default function AchievementsVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false);
  const reduced = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    const host = video?.parentElement?.parentElement;
    if (!video || !host) return;
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    userPaused.current = reduced.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true);
          if (!userPaused.current) video.play().catch(() => setPlaying(false));
        } else {
          video.pause();
        }
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => undefined);
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  return (
    <>
      <div className="achievements-video" aria-hidden="true">
        <video
          ref={videoRef}
          src={load ? VIDEO_SRC : undefined}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          disablePictureInPicture
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={(e) => {
            if (e.currentTarget.src !== VIDEO_FALLBACK) e.currentTarget.src = VIDEO_FALLBACK;
          }}
        />
        <div className="achievements-video__shade" />
      </div>
      <button
        type="button"
        className="achievements-video__toggle"
        onClick={toggle}
        aria-pressed={!playing}
        aria-label={playing ? 'Pause background video' : 'Play background video'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
        )}
        <span>{playing ? 'Pause' : 'Play'}</span>
      </button>
    </>
  );
}
