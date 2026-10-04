'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// cobe (and react-spring, which the globe uses) load only when the globe nears the viewport.
const Cobe = dynamic(() => import('@/components/ui/cobe-globe').then((m) => m.Cobe), { ssr: false });
import { useMediaQuery } from '@/composables';
import { media } from '@/config';

/*
 * Cobe only takes hex colours, so it can't read var(--contact-dark) directly. Instead the globe is
 * rendered as a neutral black/white mask (white land dots on a flat sphere, no glow, no markers)
 * and contact.css tints it: invert → dots black on white, a var(--contact-dark) layer with
 * `lighten` turns black into the token, and `multiply` drops the white into the section. So the
 * only on-screen colour is var(--contact-dark) itself: no copy of the token exists to drift.
 */
/** Mask "on": every pixel drawn with this renders as var(--contact-dark). */
const MASK_INK = '#ffffff';
/** Mask "off": renders as nothing (glow disabled). */
const MASK_NONE = '#000000';

const GLOBE_MASK = {
  dark: 1,
  baseColor: MASK_INK,
  markerColor: MASK_INK,
  markerSize: 0,
  glowColor: MASK_NONE,
  diffuse: 1.4,
  mapSamples: 12000,
  mapBrightness: 6,
  mapBaseBrightness: 0,
  opacity: 1,
};

/** createGlobe throws without WebGL; skip the globe rather than break the section. */
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Decorative Cobe globe behind the Contact section. Rendered only while the section is near the
 * viewport (Cobe runs its own WebGL frame loop, which unmounting stops), never interactive, and
 * static under reduced motion ("draggable" is Cobe's variant without automatic rotation; with
 * pointer events disabled it simply holds still).
 */
export default function ContactGlobe() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const reduceMotion = useMediaQuery(media.reducedMotion);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || !supportsWebGL()) return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="contact-globe-background" aria-hidden="true">
      <div className="contact-globe">
        {near && (
          <Cobe variant={reduceMotion ? 'draggable' : 'auto-rotation'} {...GLOBE_MASK} style={{ maxWidth: 'none' }} />
        )}
        <span className="contact-globe__ink" />
      </div>
    </div>
  );
}
