import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

/** Previous / next buttons flanking the pagination dots. */
export default function ProjectCarouselControls({ onPrev, onNext, children }: { onPrev: () => void; onNext: () => void; children: ReactNode }) {
  return (
    <div className="pcr__controls">
      <button type="button" className="pcr__arrow" aria-label="Previous project" onClick={onPrev}>
        <ArrowLeft aria-hidden="true" size={18} strokeWidth={1.8} />
      </button>
      {children}
      <button type="button" className="pcr__arrow" aria-label="Next project" onClick={onNext}>
        <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
      </button>
    </div>
  );
}
