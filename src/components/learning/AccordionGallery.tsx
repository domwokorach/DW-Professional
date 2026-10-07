'use client';

import Image from 'next/image';
import { useRef, useState, type KeyboardEvent } from 'react';
import { achievements } from '@/data/achievements';

/** React port of Vue Bits AccordionGallery, styled for the DOMINIC portfolio. */
export default function AccordionGallery() {
  const [active, setActive] = useState(7);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % achievements.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index - 1 + achievements.length) % achievements.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = achievements.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  };

  return (
    <div className="achievement-accordion" role="group" aria-label="Proud moments photo gallery">
      {achievements.map((item, index) => {
        const selected = active === index;
        return (
          <button
            key={item.src}
            ref={(button) => { buttons.current[index] = button; }}
            type="button"
            className={`achievement-accordion__panel${selected ? ' is-active' : ''}`}
            aria-label={`${item.label}, photograph ${index + 1} of ${achievements.length}`}
            aria-pressed={selected}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              loading="lazy"
              sizes={selected
                ? '(max-width: 980px) calc(100vw - 40px), 46vw'
                : '(max-width: 980px) 360px, 8vw'}
              style={{ objectPosition: item.position }}
              draggable={false}
            />
            <span className="achievement-accordion__shade" aria-hidden="true" />
            <span className="achievement-accordion__caption" aria-hidden="true">
              <span className="achievement-accordion__number">{String(index + 1).padStart(2, '0')} / 15</span>
              <span className="achievement-accordion__name">{item.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
