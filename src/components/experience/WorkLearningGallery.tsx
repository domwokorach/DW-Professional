'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import type { ExperienceImage } from '@/types';

const responsiveUrl = (src: string, width: number) =>
  src.replace('/image/upload/f_auto,q_auto/', `/image/upload/f_auto,q_auto,w_${width}/`);

export default function WorkLearningGallery({ images }: { images: ExperienceImage[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);
  const touchStart = useRef<number | null>(null);
  const previousOverflow = useRef('');
  const [current, setCurrent] = useState(0);
  const titleId = useId();
  const image = images[current];

  const open = (index: number) => {
    setCurrent(index);
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
  };

  const close = () => dialog.current?.close();
  const previous = () => setCurrent((index) => (index - 1 + images.length) % images.length);
  const next = () => setCurrent((index) => (index + 1) % images.length);

  useEffect(() => () => {
    document.body.style.overflow = previousOverflow.current;
  }, []);

  const onClose = () => {
    document.body.style.overflow = previousOverflow.current;
    triggers.current[current]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
  };

  const onTouchStart = (event: TouchEvent) => {
    touchStart.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current;
    const end = event.changedTouches[0]?.clientX;
    touchStart.current = null;
    if (start == null || end == null || Math.abs(end - start) < 50) return;
    if (end < start) next();
    else previous();
  };

  const useFallback = (element: HTMLImageElement, fallbackSrc: string) => {
    element.removeAttribute('srcset');
    if (element.src !== fallbackSrc) element.src = fallbackSrc;
  };

  return (
    <div className="xp-gallery" aria-label="Work Learning image gallery">
      {images.map((item, index) => (
        <button
          key={item.originalSrc}
          ref={(element) => { triggers.current[index] = element; }}
          type="button"
          className="xp-gallery__item"
          onClick={() => open(index)}
          aria-label={`Open image ${index + 1} of ${images.length}: ${item.alt}`}
        >
          <img
            src={responsiveUrl(item.src, 800)}
            srcSet={`${responsiveUrl(item.src, 480)} 480w, ${responsiveUrl(item.src, 800)} 800w, ${responsiveUrl(item.src, 1200)} 1200w`}
            sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw"
            alt={item.alt}
            width={item.width}
            height={item.height}
            loading="lazy"
            decoding="async"
            onError={(event) => useFallback(event.currentTarget, item.fallbackSrc)}
          />
          <span className="xp-gallery__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        </button>
      ))}

      <dialog
        ref={dialog}
        className="xp-lightbox xp-gallery-lightbox"
        aria-labelledby={titleId}
        onClose={onClose}
        onKeyDown={onKeyDown}
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      >
        <div className="xp-lightbox__panel">
          <div className="xp-lightbox__head">
            <h2 id={titleId}>Work Learning <span aria-hidden="true">· {current + 1}/{images.length}</span></h2>
            <button type="button" className="xp-lightbox__close" onClick={close} autoFocus>
              <span aria-hidden="true">×</span>
              <span className="sr-only">Close image gallery</span>
            </button>
          </div>
          <div className="xp-gallery-lightbox__stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <button type="button" className="xp-gallery-lightbox__nav xp-gallery-lightbox__nav--previous" onClick={previous} aria-label="Previous image">←</button>
            <img
              key={image.originalSrc}
              src={responsiveUrl(image.src, 1800)}
              srcSet={`${responsiveUrl(image.src, 1200)} 1200w, ${responsiveUrl(image.src, 1800)} 1800w, ${responsiveUrl(image.src, 2400)} 2400w`}
              sizes="calc(100vw - 64px)"
              alt={image.alt}
              width={image.width}
              height={image.height}
              onError={(event) => useFallback(event.currentTarget, image.fallbackSrc)}
            />
            <button type="button" className="xp-gallery-lightbox__nav xp-gallery-lightbox__nav--next" onClick={next} aria-label="Next image">→</button>
          </div>
          <a href={image.originalSrc} target="_blank" rel="noopener noreferrer" className="xp-lightbox__fallback">
            Open original image<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </dialog>
    </div>
  );
}
