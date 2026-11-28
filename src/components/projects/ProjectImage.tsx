'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Project } from '@/types';

/** Project screenshot at its original aspect ratio. If the file fails to load, the title is shown instead of a broken image. */
export default function ProjectImage({ project: p, alt = '', sizes, priority = false }: { project: Project; alt?: string; sizes: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!p.image) return null;
  if (failed) {
    return (
      <div className="xp-missing" role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <span aria-hidden="true">{p.title}</span>
      </div>
    );
  }
  return (
    <Image
      src={p.image.src}
      width={p.image.width}
      height={p.image.height}
      alt={alt}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      // A 404 can land before hydration, so onError never fires: catch an already-failed image on mount.
      ref={(el) => { if (el?.complete && el.naturalWidth === 0) setFailed(true); }}
    />
  );
}
