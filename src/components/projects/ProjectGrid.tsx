'use client';

import { useRef } from 'react';
import { projects } from '@/data/projects';
import { useStaggerReveal } from '@/composables';
import ProjectCard from './ProjectCard';

export default function ProjectGrid() {
  const ref = useRef<HTMLUListElement>(null);
  const reveal = useStaggerReveal(ref, '.pg-item');

  return (
    <ul ref={ref} className={`pg-grid${reveal ? ' pg-reveal' : ''}`}>
      {projects.map((p, i) => (
        <li key={p.id} className="pg-item">
          <ProjectCard project={p} index={i} />
        </li>
      ))}
    </ul>
  );
}
