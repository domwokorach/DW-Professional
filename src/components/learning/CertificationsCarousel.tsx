'use client';

import { useMemo, useState } from 'react';
import { SwipeableCards, type CardWithId } from '@daformat/react-swipeable-cards';
import { ArrowLeft, ArrowRight, ExternalLink, ImageOff } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import type { Certification } from '@/types';
import { bringCardToFront, showNextCard, showPreviousCard } from './carouselStack';

type PreviewState = 'loading' | 'ready' | 'error';

export function CertificatePreview({ certificate, active = true }: { certificate: Certification; active?: boolean }) {
  const [state, setState] = useState<PreviewState>('loading');

  return (
    <div className="cert-card__preview">
      {state !== 'ready' ? (
        <div className={`cert-card__preview-fallback${state === 'loading' ? ' is-loading' : ''}`} data-testid="certificate-fallback">
          {state === 'error' ? <ImageOff size={20} aria-hidden="true" /> : <span className="cert-card__skeleton" aria-hidden="true" />}
          <span>{certificate.number} / 13</span>
          <strong>{certificate.technology}</strong>
          <small>{state === 'loading' ? 'Loading certificate preview' : 'Certificate preview unavailable'}</small>
        </div>
      ) : null}
      {certificate.fileType === 'image' ? (
        <img
          src={certificate.url}
          alt={`${certificate.name} certificate`}
          loading="lazy"
          decoding="async"
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
        />
      ) : active ? (
        <iframe
          src={`${certificate.url}#page=1&view=FitH&toolbar=0&navpanes=0`}
          title={`${certificate.name} certificate preview`}
          loading="lazy"
          tabIndex={-1}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
        />
      ) : null}
    </div>
  );
}

function CertificateCard({ certificate }: { certificate: Certification }) {
  const stack = SwipeableCards.useSwipeableCardsStack();
  const { setStack } = SwipeableCards.useSwipeableCardsContext();
  const isActive = stack.at(-1)?.id === certificate.id;

  const bringToFront = () => {
    if (isActive) return;
    setStack((current) => bringCardToFront(current, certificate.id));
  };

  return (
    <article className="cert-card" aria-hidden={!isActive} onClick={bringToFront}>
      <CertificatePreview certificate={certificate} active={isActive} />
      <div className="cert-card__body">
        <span className="cert-card__number" aria-hidden="true">{certificate.number}</span>
        <div className="cert-card__content">
          {certificate.category || certificate.level ? <div className="cert-card__eyebrow">{certificate.category ? <span>{certificate.category}</span> : null}{certificate.level ? <span>{certificate.level}</span> : null}</div> : null}
          <h3>{certificate.name}</h3>
          <p className="cert-card__issuer">{certificate.issuer ?? 'Issuer not specified'}{certificate.technology ? ` · ${certificate.technology}` : ''}</p>
          {certificate.issuedAt ? <p className="cert-card__date">Issued <time dateTime={certificate.issuedAt}>{certificate.issuedAt}</time></p> : null}
          <a className="cert-card__link" href={certificate.credentialUrl ?? certificate.url} target="_blank" rel="noopener noreferrer" tabIndex={isActive ? 0 : -1} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
            View Certificate <ExternalLink size={14} aria-hidden="true" />
            <span className="sr-only">: {certificate.name} (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </article>
  );
}

function CarouselExperience({ certifications }: { certifications: Certification[] }) {
  const stack = SwipeableCards.useSwipeableCardsStack();
  const { setStack, discardedCardId } = SwipeableCards.useSwipeableCardsContext();
  const { trigger } = SwipeableCards.useProgrammaticSwipe();
  const reduceMotion = useReducedMotion();
  const activeId = stack.at(-1)?.id;
  const activeIndex = Math.max(certifications.findIndex(({ id }) => id === activeId), 0);

  const select = (id: string) => {
    if (discardedCardId) return;
    setStack((current) => bringCardToFront(current, id));
  };

  const navigate = (direction: 'previous' | 'next') => {
    if (discardedCardId) return;
    if (direction === 'previous') {
      setStack(showPreviousCard);
      return;
    }
    if (reduceMotion) {
      setStack(showNextCard);
      return;
    }
    trigger((state, rect) => {
      state.velocityX = Math.max(rect.width / 80, 4);
      state.velocityY = 0;
      state.pivotX = -0.25;
      state.pivotY = -0.35;
      state.startX = 0;
      state.lastX = 1;
    });
  };

  return (
    <div className="cert-carousel__experience" tabIndex={0} aria-label="Certification carousel. Use the left and right arrow keys to browse." onKeyDown={(event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      navigate(event.key === 'ArrowLeft' ? 'previous' : 'next');
    }}>
      <SwipeableCards.Cards visibleStackLength={4} className="cert-carousel__stack" aria-live="polite" />
      <div className="cert-carousel__progress" aria-hidden="true"><span style={{ width: `${((activeIndex + 1) / certifications.length) * 100}%` }} /></div>
      <div className="cert-carousel__controls">
        <button type="button" onClick={() => navigate('previous')} aria-label="Previous certificate"><ArrowLeft aria-hidden="true" size={18} /></button>
        <p className="cert-carousel__counter" aria-live="polite" aria-atomic="true"><span className="sr-only">Certificate </span>{String(activeIndex + 1).padStart(2, '0')} / {String(certifications.length).padStart(2, '0')}</p>
        <button type="button" onClick={() => navigate('next')} aria-label="Next certificate"><ArrowRight aria-hidden="true" size={18} /></button>
      </div>
      <div className="cert-carousel__pagination" aria-label="Choose a certificate">
        {certifications.map((certificate, index) => (
          <button key={certificate.id} type="button" className={index === activeIndex ? 'is-active' : ''} onClick={() => select(certificate.id)} aria-label={`Show certificate ${index + 1}: ${certificate.name}`} aria-current={index === activeIndex ? 'true' : undefined} />
        ))}
      </div>
    </div>
  );
}

export default function CertificationsCarousel({ certifications, error }: { certifications: Certification[]; error?: string }) {
  const cards = useMemo<CardWithId[]>(() => [...certifications].reverse().map((certificate) => ({ id: certificate.id, card: <CertificateCard certificate={certificate} /> })), [certifications]);
  const reduceMotion = useReducedMotion();

  if (!certifications.length) return <div className="cert-carousel cert-carousel--empty" role="status"><ImageOff aria-hidden="true" size={24}/><h3>No certificates available</h3><p>{error ?? 'New certifications will appear here automatically.'}</p></div>;

  return (
    <SwipeableCards.Root cards={cards} loop swipeStyle="sendToBack" sendToBackMargin={18} swipeDirections={reduceMotion ? [] : ['left', 'right']} className="cert-carousel">
      <CarouselExperience certifications={certifications} />
    </SwipeableCards.Root>
  );
}
