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

  const inView = useRef(false);
  const retries = useRef(0);

  const tryPlay = () => {
    const video = videoRef.current;
    if (!video || !inView.current || userPaused.current || !video.paused) return;
    video.play().catch(() => undefined);
  };

  useEffect(() => {
    const video = videoRef.current;
    const host = video?.parentElement?.parentElement;
    if (!video || !host) return;
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    userPaused.current = reduced.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          setLoad(true);
          tryPlay();
        } else {
          video.pause();
        }
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // The src is attached on the render after `load` flips, so start playback once it exists.
  useEffect(() => {
    if (load) tryPlay();
  }, [load]);

  // Keep it moving: restart after an unexpected pause (tab switch, decoder hiccup), a loop that failed to wrap, or a
  // frame that stops advancing. Only a pause the visitor asked for (or reduced motion) is left alone.
  useEffect(() => {
    const video = videoRef.current;
    if (!load || !video) return;
    let lastTime = -1;
    let stuck = 0;
    const wanted = () => inView.current && !userPaused.current && !document.hidden;
    const resume = () => { if (wanted() && video.paused) video.play().catch(() => undefined); };
    const onEnded = () => { video.currentTime = 0; resume(); };
    const watchdog = window.setInterval(() => {
      if (!wanted()) { stuck = 0; return; }
      if (video.paused) { resume(); return; }
      const t = video.currentTime;
      stuck = t === lastTime ? stuck + 1 : 0;
      lastTime = t;
      if (stuck === 2) {
        // Frame stopped advancing: nudge the playhead.
        video.currentTime = t + 0.05;
        video.play().catch(() => undefined);
      } else if (stuck >= 4 && retries.current < 3) {
        // Still stuck: reload the source from the same spot.
        retries.current += 1;
        stuck = 0;
        video.load();
        video.currentTime = t;
        resume();
      }
    }, 1500);
    video.addEventListener('pause', resume);
    video.addEventListener('ended', onEnded);
    video.addEventListener('stalled', resume);
    video.addEventListener('playing', () => { retries.current = 0; });
    document.addEventListener('visibilitychange', resume);
    return () => {
      window.clearInterval(watchdog);
      video.removeEventListener('pause', resume);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('stalled', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [load]);

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
          autoPlay
          muted
          loop
          playsInline
          preload={load ? 'auto' : 'none'}
          onCanPlay={tryPlay}
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
