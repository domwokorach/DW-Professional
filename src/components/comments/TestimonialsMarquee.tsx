'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Testimonial } from '@/data/testimonials';
import { initials } from './format';
import VerifiedBadge from './VerifiedBadge';

const VISUAL_COPIES = 3;

function TestimonialCard({ testimonial, decorative = false }: { testimonial: Testimonial; decorative?: boolean }) {
  return (
    <article className="t19-card" tabIndex={decorative ? undefined : 0} aria-hidden={decorative || undefined}>
      <header className="t19-card__head">
        <span className="t19-avatar-wrap">
          <span className="t19-avatar" role="img" aria-label={`${testimonial.organisation} avatar`}>
            {testimonial.avatarUrl ? (
              <img src={testimonial.avatarUrl} alt="" loading="lazy" decoding="async" draggable={false} />
            ) : (
              <span aria-hidden="true">{initials(testimonial.organisation)}</span>
            )}
          </span>
          <VerifiedBadge label="Verified testimonial" solid />
        </span>
        <div className="t19-card__identity">
          <h3>{testimonial.organisation}</h3>
          <p>{testimonial.company}</p>
        </div>
      </header>
      <blockquote>
        <p>{testimonial.quote}</p>
        <footer>— <cite>{testimonial.attribution}</cite></footer>
      </blockquote>
      <time dateTime={testimonial.dateTime}>{testimonial.date}</time>
    </article>
  );
}

/**
 * A continuously looping testimonial row. Visual copies are animation scaffolding only: just the
 * first card is exposed to assistive technology, and genuine future records can replace the copies.
 */
export default function TestimonialsMarquee({ items }: { items: Testimonial[] }) {
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  if (!items.length) return null;

  const copies = Array.from({ length: Math.max(VISUAL_COPIES, items.length) }, (_, index) => items[index % items.length]);
  const finishInteraction = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      setInteracting(false);
      return;
    }
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setInteracting(false), 1400);
  };

  return (
    <section className="t19" aria-label="Featured testimonials">
      <div className="t19-toolbar">
        <p>Featured testimonial</p>
        <button
          type="button"
          className="t19-toggle"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          aria-label={paused ? 'Resume automatic testimonial scrolling' : 'Pause automatic testimonial scrolling'}
        >
          <span className="t19-toggle__icon" aria-hidden="true">{paused ? '▶' : '‖'}</span>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <div className="t19-frame">
        <div
          className="t19-viewport"
          data-paused={paused || interacting ? 'true' : undefined}
          onPointerDown={() => { clearTimeout(resumeTimer.current); setInteracting(true); }}
          onPointerUp={finishInteraction}
          onPointerCancel={finishInteraction}
        >
          <div className="t19-track">
            {[0, 1].map((group) => (
              <div className="t19-group" key={group} aria-hidden={group === 1 ? true : undefined}>
                {copies.map((testimonial, index) => (
                  <TestimonialCard
                    key={`${group}-${testimonial.id}-${index}`}
                    testimonial={testimonial}
                    decorative={group === 1 || index >= items.length}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
