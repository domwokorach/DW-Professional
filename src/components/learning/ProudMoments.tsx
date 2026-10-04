'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimatedTestimonials, type AnimatedTestimonialItem } from '@/components/ui';
import { achievements } from '@/data';
import type { Achievement } from '@/types';

type VideoAchievement = Extract<Achievement, { mediaType: 'video' }>;
type OpenVideo = (a: VideoAchievement, trigger: HTMLButtonElement) => void;

/**
 * Inline preview: muted, looping, letterboxed in the shared frame. Plays only while it is the
 * front item, on screen, motion is allowed and the pop-out is closed (reduced motion: poster
 * until the viewer presses the corner button, which also covers WCAG 2.2.2 pause).
 * Clicking (or Enter/Space on) the preview opens the full video, with sound, in the pop-out player.
 */
function Video({ a, active, paused, onOpen }: { a: VideoAchievement; active: boolean; paused: boolean; onOpen: OpenVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  // null = automatic (play unless reduced motion); true/false once the viewer has chosen.
  const [choice, setChoice] = useState<boolean | null>(null);
  const wantPlay = choice ?? !reduce;
  const playing = active && visible && wantPlay && !paused;

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing) el.play().catch(() => { /* blocked by browser policy: the poster stays */ });
    else el.pause();
  }, [playing]);

  return (
    // The wrapper sets the size (the shared frame); the video only fills it, letterboxed, so its
    // intrinsic size never drives layout and the whole picture stays visible.
    <div className="pm-video">
      <video
        ref={ref}
        className="pm-video__el"
        src={a.src}
        poster={a.poster}
        muted
        playsInline
        loop
        preload="metadata"
        aria-hidden="true"
      />
      {/* The whole preview is the trigger: no icon over the picture. */}
      <button
        type="button"
        className="pm-open"
        // inert already removes cards behind the front one; this covers browsers without inert.
        tabIndex={active ? undefined : -1}
        aria-haspopup="dialog"
        aria-label={`Open ${a.title} video`}
        onClick={(e) => onOpen(a, e.currentTarget)}
      />
      <button
        type="button"
        className="pm-play"
        tabIndex={active ? undefined : -1}
        aria-label={wantPlay ? 'Pause preview' : 'Play preview'}
        onClick={() => setChoice(!wantPlay)}
      >
        {wantPlay ? (
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false"><path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        ) : (
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false"><path d="M5 3l8 5-8 5z" fill="currentColor" /></svg>
        )}
      </button>
    </div>
  );
}

/**
 * Pop-out player. A modal <dialog>: the page behind is inert (focus stays inside), Escape closes,
 * and the page cannot scroll. The <video> exists only while open, so nothing plays in the
 * background after closing. Native controls give play/pause, seek, volume and fullscreen.
 */
function VideoModal({ video, onClose, onClosed }: { video: VideoAchievement | null; onClose: () => void; onClosed: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !video) return;
    dialog.showModal();
    // Opened by an explicit click, so sound is allowed; if the browser still blocks it, the
    // controls are there.
    videoRef.current?.play().catch(() => {});
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prevOverflow;
      if (dialog.open) dialog.close();
      // The page is interactive again once the dialog has closed: return focus to the Play button.
      onClosed();
    };
  }, [video, onClosed]);

  return (
    <dialog
      ref={dialogRef}
      className="pm-modal"
      aria-labelledby="pm-modal-title"
      aria-describedby="pm-modal-desc"
      // Every close path calls onClose directly; the async `close` event is only a fallback, as
      // browsers may delay it (e.g. in background tabs). Clearing `video` closes the dialog.
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      // Ignore a late close event that arrives after the player has been reopened.
      onClose={(e) => { if (!e.currentTarget.open) onClose(); }}
      // A click on the backdrop lands on the <dialog> itself, not its content.
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {video && (
        <figure className="pm-modal__content">
          <video
            ref={videoRef}
            className="pm-modal__video"
            src={video.fullSrc}
            poster={video.poster}
            controls
            playsInline
            preload="auto"
            aria-label={video.alt}
            // Once the real proportions are known, size to the largest box that fits the viewport.
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) v.style.setProperty('--ar', String(v.videoWidth / v.videoHeight));
            }}
          />
          {/* Same data as the inline item, so the two never drift apart. */}
          <figcaption className="pm-modal__caption">
            <span className="pm-modal__num">{video.number}</span>
            <h2 className="pm-modal__title" id="pm-modal-title">{video.title}</h2>
            <p className="pm-modal__desc" id="pm-modal-desc">{video.description}</p>
          </figcaption>
        </figure>
      )}
      <button type="button" className="pm-modal__close" aria-label="Close video" onClick={onClose}>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
    </dialog>
  );
}

function Media({ a, active, load, modalOpen, onOpen }: { a: Achievement; active: boolean; load: boolean; modalOpen: boolean; onOpen: OpenVideo }) {
  // Not near the front yet: leave the card empty so its photo or video isn't fetched.
  if (!load && a.mediaType !== 'stat') return null;
  switch (a.mediaType) {
    case 'video':
      return <Video a={a} active={active} paused={modalOpen} onOpen={onOpen} />;
    case 'image':
      return (
        <Image
          className="pm-media"
          src={a.src}
          alt={a.alt}
          fill
          sizes="(max-width: 768px) 90vw, 440px"
          style={a.position ? { objectPosition: a.position } : undefined}
          draggable={false}
        />
      );
    case 'stat':
      // Items without footage: the stat as a tile, in the same frame.
      return (
        <div className="pm-tile">
          {a.stat.badge && <span className="pm-tile__badge" aria-hidden="true">{a.stat.badge}</span>}
          <strong className="pm-tile__value">{a.stat.value}</strong>
        </div>
      );
  }
}

export default function ProudMoments() {
  const [open, setOpen] = useState<VideoAchievement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  const openVideo = useCallback<OpenVideo>((a, el) => {
    trigger.current = el;
    setOpen(a);
  }, []);

  // Idempotent: may run twice (direct call, then the dialog's own close event).
  const close = useCallback(() => setOpen(null), []);
  const restoreFocus = useCallback(() => trigger.current?.focus(), []);

  const modalOpen = open !== null;
  const items = useMemo<AnimatedTestimonialItem[]>(() => achievements.map((a) => ({
    id: a.number.slice(0, 2),
    eyebrow: a.number,
    title: a.title,
    body: a.description,
    media: (active, load) => <Media a={a} active={active} load={load} modalOpen={modalOpen} onOpen={openVideo} />,
  })), [modalOpen, openVideo]);

  return (
    <>
      <AnimatedTestimonials
        items={items}
        label="Proud moments"
        prevLabel="Previous achievement"
        nextLabel="Next achievement"
      />
      <VideoModal video={open} onClose={close} onClosed={restoreFocus} />
    </>
  );
}
