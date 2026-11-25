'use client';

import { useRef } from 'react';
import { projects } from '@/data/projects';
import { useStaggerReveal } from '@/hooks';
import ProjectFeature from './ProjectFeature';
import ProjectIndexRow from './ProjectIndexRow';

/** Projects with a live link or screenshot are shown as features; the rest form a quiet index below. */
const isFeature = (p: (typeof projects)[number]) => Boolean(p.url || p.image);
const features = projects.filter(isFeature);
const archive = projects.filter((p) => !isFeature(p));

export default function ProjectGrid() {
  const featureRef = useRef<HTMLOListElement>(null);
  const archiveRef = useRef<HTMLOListElement>(null);
  const revealFeatures = useStaggerReveal(featureRef, '.pg-item');
  const revealArchive = useStaggerReveal(archiveRef, '.pg-item');

  return (
    <>
      <ol ref={featureRef} className={`pf-list${revealFeatures ? ' pg-reveal' : ''}`}>
        {features.map((p, i) => (
          <li key={p.id} className="pg-item">
            <ProjectFeature project={p} index={i} total={features.length} flip={i % 2 === 1} />
          </li>
        ))}
      </ol>
      {archive.length > 0 && (
        <section className="pi" aria-labelledby="pi-heading">
          <h3 id="pi-heading" className="pi-title">More work <span aria-hidden="true">· {String(archive.length).padStart(2, '0')}</span></h3>
          <ol ref={archiveRef} className={`pi-list${revealArchive ? ' pg-reveal' : ''}`}>
            {archive.map((p, i) => (
              <li key={p.id} className="pg-item">
                <ProjectIndexRow project={p} index={features.length + i} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
