'use client';

import { useEffect, useRef } from 'react';
import type { ExperienceProject } from '@/types';

type ProjectVideoData = NonNullable<ExperienceProject['video']>;

// Cloudinary's automatic quality/format is far smaller than the original upload; the original stays as the fallback source.
const optimised = (src: string) => src.replace('/video/upload/', '/video/upload/q_auto,f_auto/');

/**
 * Project demo video. The file is only fetched once the video nears the viewport (not on page load), it plays
 * while visible and pauses when scrolled away, and it stays paused for visitors who prefer reduced motion.
 */
export default function ProjectVideo({ name, video }: { name: string; video: ProjectVideoData }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let loaded = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) { el.pause(); return; }
        if (!loaded) { loaded = true; el.preload = 'auto'; el.load(); }
        if (!reduceMotion) el.play().catch(() => undefined);
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      controls
      loop
      muted
      playsInline
      preload="none"
      poster={video.poster}
      width={video.width}
      height={video.height}
      aria-label={`${name} project demonstration video`}
    >
      <source src={optimised(video.src)} />
      <source src={video.src} type="video/mp4" />
      {video.fallbackSrc && <source src={video.fallbackSrc} type="video/quicktime" />}
      Your browser does not support inline video.{' '}
      <a href={video.fallbackSrc ?? video.src} target="_blank" rel="noopener noreferrer">
        Open the demonstration video
      </a>.
    </video>
  );
}
