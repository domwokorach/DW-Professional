import { Timeline, type TimelineEntry } from '@/components/ui';
import { experiences } from '@/data';
import type { Experience } from '@/types';

function Projects({ projects }: { projects: NonNullable<Experience['projects']> }) {
  const headingId = 'xp-projects-heading';

  return (
    <section className="xp-projects" aria-labelledby={headingId}>
      <h4 className="xp-label" id={headingId}>Freelance projects <span aria-hidden="true">· {String(projects.length).padStart(2, '0')}</span></h4>
      <ol className="xp-projects__list">
        {projects.map((proj, i) => (
          <li key={proj.name}>
            <span className="xp-projects__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h5>{proj.name}</h5>
            <p>{proj.description}</p>
          </li>
        ))}
      </ol>
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
      {xp.projects && <Projects projects={xp.projects} />}
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
