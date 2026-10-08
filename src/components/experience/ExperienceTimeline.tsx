import { LinkIcon } from '@/components/animate-ui/icons/link';
import { Timeline, type TimelineEntry } from '@/components/ui';
import IconLink from '@/components/ui/IconLink';
import { experiences } from '@/data';
import type { Experience } from '@/types';
import ProjectImagePreview from './ProjectImagePreview';
import WorkLearningGallery from './WorkLearningGallery';

function Projects({ id, label, projects, gallery }: { id: string; label: string; projects: NonNullable<Experience['projects']>; gallery?: Experience['projectGallery'] }) {
  const headingId = `${id}-projects`;

  return (
    <section className="xp-projects" aria-labelledby={headingId}>
      <h4 className="xp-label" id={headingId}>{label} <span aria-hidden="true">· {String(projects.length).padStart(2, '0')}</span></h4>
      <ol className="xp-projects__list">
        {projects.map((proj, i) => (
          <li key={proj.name} className={proj.url || proj.image ? 'xp-projects__item--linked' : undefined}>
            <span className="xp-projects__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h5>{proj.name}</h5>
            <p>{proj.description}</p>
            {proj.video && (
              <div className="xp-projects__media">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={proj.video.poster}
                  width={proj.video.width}
                  height={proj.video.height}
                  aria-label={`${proj.name} project demonstration video`}
                >
                  <source src={proj.video.src} type="video/mp4" />
                  <source src={proj.video.fallbackSrc} type="video/quicktime" />
                  Your browser does not support inline video.{' '}
                  <a href={proj.video.fallbackSrc} target="_blank" rel="noopener noreferrer">
                    Open the demonstration video
                  </a>.
                </video>
              </div>
            )}
            {proj.image && <ProjectImagePreview name={proj.name} image={proj.image} />}
            {proj.url && (
              <IconLink
                className="xp-projects__link"
                href={proj.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={proj.actionLabel}
                icon={LinkIcon}
              >
                {proj.video ? 'Watch Demo' : 'View Project'}<span className="sr-only">: {proj.name} (opens in a new tab)</span>
              </IconLink>
            )}
          </li>
        ))}
      </ol>
      {gallery?.length ? <WorkLearningGallery images={gallery} /> : null}
    </section>
  );
}

function Period({ xp }: { xp: Experience }) {
  return (
    <p className="xp-date">
      <time dateTime={xp.start.iso}>{xp.start.label}</time>
      <span aria-hidden="true"> – </span>
      <span className="sr-only"> to </span>
      {xp.end ? (
        <time dateTime={xp.end.iso}>{xp.end.label}</time>
      ) : (
        <span className="xp-present">
          Present
          <span className="xp-live" aria-hidden="true" />
          <span className="sr-only"> (current role)</span>
        </span>
      )}
    </p>
  );
}

function Entry({ xp }: { xp: Experience }) {
  const org = xp.company ?? xp.description;
  return (
    <article className="xp-entry">
      <h3>{xp.role}</h3>
      <p className="xp-meta">
        {org && <span className="xp-org">{org}</span>}
        {org && xp.location && <span className="xp-sep" aria-hidden="true">/</span>}
        {xp.location && <span className="xp-location">{xp.location}</span>}
      </p>
      <ul className="xp-bullets">
        {xp.bullets.map((b) => <li key={b}>{b}</li>)}
      </ul>
      {xp.projects && <Projects id={`xp-${xp.start.iso}`} label={xp.projectsLabel ?? 'Projects'} projects={xp.projects} gallery={xp.projectGallery} />}
    </article>
  );
}

const data: TimelineEntry[] = experiences.map((xp) => ({
  id: `${xp.role}-${xp.start.iso}`,
  title: <Period xp={xp} />,
  content: <Entry xp={xp} />,
  className: xp.end ? undefined : 'is-current',
}));

export default function ExperienceTimeline() {
  return <Timeline data={data} />;
}
