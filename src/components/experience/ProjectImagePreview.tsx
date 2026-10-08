'use client';

import { useEffect, useId, useRef } from 'react';
import { LinkIcon } from '@/components/animate-ui/icons/link';
import { useIconTrigger } from '@/hooks/use-icon-trigger';
import type { ExperienceProject } from '@/types';

type ProjectImage = NonNullable<ExperienceProject['image']>;

export default function ProjectImagePreview({ name, image }: { name: string; image: ProjectImage }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef('');
  const titleId = useId();
  const { active, bind } = useIconTrigger();

  const open = () => {
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
  };

  const close = () => dialog.current?.close();

  useEffect(() => () => {
    document.body.style.overflow = previousOverflow.current;
  }, []);

  const onClose = () => {
    document.body.style.overflow = previousOverflow.current;
    trigger.current?.focus();
  };

  const useFallback = (element: HTMLImageElement) => {
    if (element.src !== image.fallbackSrc) element.src = image.fallbackSrc;
  };

  return (
    <div className="xp-projects__image-feature">
      <div className="xp-projects__image-frame">
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
          onError={(event) => useFallback(event.currentTarget)}
        />
      </div>
      <button
        ref={trigger}
        type="button"
        className="xp-projects__link xp-projects__preview-trigger cta-icon-link"
        onClick={open}
        {...bind}
      >
        View Design
        <LinkIcon animate={active} size={16} className="cta-icon" aria-hidden="true" />
      </button>

      <dialog
        ref={dialog}
        className="xp-lightbox"
        aria-labelledby={titleId}
        onClose={onClose}
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      >
        <div className="xp-lightbox__panel">
          <div className="xp-lightbox__head">
            <h2 id={titleId}>{name}</h2>
            <button type="button" className="xp-lightbox__close" onClick={close} autoFocus>
              <span aria-hidden="true">×</span>
              <span className="sr-only">Close image preview</span>
            </button>
          </div>
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            onError={(event) => useFallback(event.currentTarget)}
          />
          <a href={image.originalSrc} target="_blank" rel="noopener noreferrer" className="xp-lightbox__fallback">
            Open original image<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </dialog>
    </div>
  );
}
