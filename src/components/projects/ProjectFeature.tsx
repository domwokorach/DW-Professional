import Image from 'next/image';
import { LinkIcon } from '@/components/animate-ui/icons/link';
import { IconLink } from '@/components/ui';
import type { Project } from '@/types';

/** One live project as an editorial spread: large numeral, framed screenshot, copy and a single link. */
export default function ProjectFeature({ project: p, index, total, flip }: { project: Project; index: number; total: number; flip?: boolean }) {
  const titleId = `project-${p.id}`;
  const n = String(index + 1).padStart(2, '0');

  return (
    <article className={`pf${flip ? ' pf--flip' : ''}${p.url ? ' pf--live' : ''}`} aria-labelledby={titleId}>
      {p.image && (
        <div className="pf-shot">
          <Image src={p.image.src} width={p.image.width} height={p.image.height} alt="" sizes="(max-width: 900px) 100vw, 640px" />
        </div>
      )}
      <div className="pf-copy">
        <p className="pf-kicker">
          <span className="pf-num" aria-hidden="true">{n}<span> / {String(total).padStart(2, '0')}</span></span>
          <span className="sr-only">Category: </span>{p.category}
          {p.url && <span className="pc-live"><span className="pc-live__dot" aria-hidden="true" />Live</span>}
        </p>
        <h3 id={titleId}>{p.title}</h3>
        {p.headline && <p className="pf-headline">{p.headline}</p>}
        <div className="pf-desc">{p.description.map((para) => <p key={para}>{para}</p>)}</div>
        <p className="pf-focus"><span className="sr-only">Focus areas: </span>{p.focus.join(' · ')}</p>
        <h4 className="sr-only">Technologies and skills</h4>
        <ul className="pc-tags">{p.tech.map((t) => <li key={t}>{t}</li>)}</ul>
        {p.url && (
          <IconLink
            className="pf-link"
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${p.title} live project (opens in a new tab)`}
            icon={LinkIcon}
            iconSize={14}
          >
            {p.linkLabel ?? 'View project'}
          </IconLink>
        )}
      </div>
    </article>
  );
}
