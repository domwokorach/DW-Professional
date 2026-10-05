import { LinkIcon } from '@/components/animate-ui/icons/link';
import { IconLink } from '@/components/ui';
import type { Project } from '@/types';

export default function ProjectCard({ project: p, index }: { project: Project; index: number }) {
  const n = String(index + 1).padStart(2, '0');
  const titleId = `project-${p.id}`;

  return (
    <article className={`pc${p.url ? ' pc--live' : ''}`} aria-labelledby={titleId}>
      <p className="pc-kicker">
        <span className="pc-num" aria-hidden="true">{n}</span>
        <span className="pc-kicker__sep" aria-hidden="true">/</span>
        <span className="sr-only">Category: </span>{p.category}
        {p.url && <span className="pc-live"><span className="pc-live__dot" aria-hidden="true" />Live</span>}
      </p>
      <h3 id={titleId}>{p.title}</h3>
      <p className="pc-headline">{p.headline}</p>
      <div className="pc-desc">
        {p.description.map((para) => <p key={para}>{para}</p>)}
      </div>

      <div className="pc-foot">
        <h4 className="sr-only">Focus areas</h4>
        <p className="pc-focus">
          {p.focus.map((f, i) => (
            <span key={f}>{i > 0 && <span className="pc-focus__sep" aria-hidden="true"> · </span>}{f}</span>
          ))}
        </p>
        <h4 className="sr-only">Technologies and skills</h4>
        <ul className="pc-tags">
          {p.tech.map((t) => <li key={t}>{t}</li>)}
        </ul>
        {p.url && (
          <IconLink
            className="pc-link"
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${p.title} live project (opens in a new tab)`}
            icon={LinkIcon}
            iconSize={14}
          >
            View project
          </IconLink>
        )}
      </div>
    </article>
  );
}
