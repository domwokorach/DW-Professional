import { LockKeyhole } from 'lucide-react';
import type { Project } from '@/types';

/** A project without a public demo yet: one quiet row, number · title · summary · tech. */
export default function ProjectIndexRow({ project: p, index }: { project: Project; index: number }) {
  const titleId = `project-${p.id}`;
  return (
    <article className="pi-row" aria-labelledby={titleId}>
      <span className="pi-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div className="pi-main">
        <h4 id={titleId}>{p.title}</h4>
        {p.headline && <p className="pi-headline">{p.headline}</p>}
        <p className="pi-focus"><span className="sr-only">Category: </span>{p.focus.join(' · ')}</p>
      </div>
      <ul className="pc-tags pi-tags" aria-label="Technologies and skills">{p.tech.map((t) => <li key={t}>{t}</li>)}</ul>
      <p className={`pi-status${p.confidential ? ' pi-status--confidential' : ''}`}>
        {p.confidential && <LockKeyhole aria-hidden="true" size={13} strokeWidth={1.8} />}
        {p.confidential ? 'Internal Project · Confidential' : 'Details coming soon'}
      </p>
    </article>
  );
}
