'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import type { PublicComment } from '@/lib/comments';
import { formatCommentDate, initials } from './format';
import VerifiedBadge from './VerifiedBadge';

/** How long a comment stays up before autoplay moves on: a base plus reading time, capped. */
const readingTime = (c: PublicComment) => Math.min(16000, 6000 + c.comment.length * 20);
const SWIPE_MIN = 48;
const mod = (n: number, m: number) => ((n % m) + m) % m;

const Arrow = ({ dir }: { dir: 'prev' | 'next' }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
);
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
);

/**
 * The feed of approved comments as a looping carousel: one comment at a time, previous/next, swipe, and a visible
 * Pause/Resume autoplay button.
 *
 * - All slides share one grid cell, so the carousel is always as tall as the tallest comment: no layout jump
 *   between slides, and every card is the same height.
 * - Autoplay loops (the last comment is followed by the first), waits a reading time per comment, and resumes from
 *   the current comment, not the first. Pausing is the visitor's explicit choice and sticks while they stay on the
 *   page; manual navigation always works. Autoplay also holds while the pointer is over the slide, while the slide
 *   has keyboard focus or a finger is on it, while the carousel is off screen and while the tab is hidden: none of
 *   that changes the button, which always shows the visitor's own setting.
 * - With prefers-reduced-motion, autoplay starts off (the button then offers "Resume autoplay") and slides
 *   crossfade without moving.
 */
export default function CommentsCarousel({ items }: { items: PublicComment[] }) {
  const reduce = useReducedMotion();
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null); // null: follow the motion preference
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [touching, setTouching] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const playing = userPlaying ?? !reduce;
  const running = playing && count > 1 && !hover && !focus && !touching && onScreen && !tabHidden;

  const go = useCallback((to: number, direction: 'next' | 'prev') => {
    const target = mod(to, count);
    if (count < 2 || target === index) return;
    setDir(direction);
    setLeaving(index);
    setIndex(target);
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setLeaving(null), 700);
  }, [count, index]);
  const next = () => go(index + 1, 'next');
  const prev = () => go(index - 1, 'prev');
  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  // New comments arriving or fewer of them: keep the index valid.
  useEffect(() => { if (index >= count && count > 0) setIndex(0); }, [count, index]);

  // Autoplay: one timer per comment, restarted whenever the comment, or whether autoplay may run, changes.
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => go(index + 1, 'next'), readingTime(items[index] ?? items[0]));
    return () => clearTimeout(timer);
  }, [running, index, items, go]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    const el = viewport.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); go(0, 'prev'); }
    else if (e.key === 'End') { e.preventDefault(); go(count - 1, 'next'); }
  };
  // Swipe (touch and pen only; a mouse keeps normal text selection). Vertical movement is left to page scrolling.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return;
    swipe.current = { x: e.clientX, y: e.clientY };
    setTouching(true);
  };
  const endSwipe = (e: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    setTouching(false);
    if (!start || e.type === 'pointercancel') return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(e.clientY - start.y) * 1.2) (dx < 0 ? next : prev)();
  };

  const state = (i: number) => (i === index ? 'is-active' : i === leaving ? 'is-leaving' : '');
  const announce = running ? 'off' : 'polite'; // no announcements while it rotates by itself

  return (
    <section className="cm-carousel" aria-roledescription="carousel" aria-label="Comments">
      <div
        ref={viewport}
        className="cm-viewport"
        tabIndex={0}
        aria-live={announce}
        aria-label="Comment slides. Use the left and right arrow keys to change comment."
        onKeyDown={onKeyDown}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(true); }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover(false); }}
        onFocus={(e) => { if (e.target.matches(':focus-visible')) setFocus(true); }}
        onBlur={() => setFocus(false)}
        onPointerDown={onPointerDown}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
      >
        <ul className="cm-slides" data-dir={dir}>
          {items.map((c, i) => (
            <li
              key={c.id}
              className={`cm-slide ${state(i)}`.trim()}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i === index ? undefined : true}
              inert={i !== index}
            >
              <article className="cm-card">
                <header className="cm-card__head">
                  <span className="cm-avatar-wrap">
                    <span className="cm-avatar" aria-hidden={c.avatarUrl ? undefined : true}>
                      {c.avatarUrl ? <img src={c.avatarUrl} alt={`Avatar of ${c.fullName}`} loading="lazy" decoding="async" draggable={false} /> : initials(c.fullName)}
                    </span>
                    {c.isVerified && <VerifiedBadge />}
                  </span>
                  <div>
                    <h4 className="cm-name">{c.fullName}</h4>
                    {c.company && <p className="cm-role">{c.company}</p>}
                  </div>
                </header>
                <blockquote className="cm-text">{c.comment}</blockquote>
                <footer className="cm-card__foot">
                  <time dateTime={c.createdAt}>{formatCommentDate(c.createdAt)}</time>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      </div>

      {count > 1 && (
        <div className="cm-controls">
          <button type="button" className="cm-nav" onClick={prev} aria-label="Previous comment"><Arrow dir="prev" /></button>
          <button type="button" className="cm-nav" onClick={next} aria-label="Next comment"><Arrow dir="next" /></button>
          <span className="cm-counter" aria-hidden="true">{index + 1} / {count}</span>
          <button
            type="button"
            className="cm-autoplay"
            onClick={() => setUserPlaying(!playing)}
            aria-label={playing ? 'Pause autoplay' : 'Resume autoplay'}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
            <span aria-hidden="true">{playing ? 'Pause autoplay' : 'Resume autoplay'}</span>
          </button>
        </div>
      )}
    </section>
  );
}
