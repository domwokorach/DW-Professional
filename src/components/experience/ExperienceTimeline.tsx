import { LinkIcon } from '@/components/animate-ui/icons/link';
import { Timeline, type TimelineEntry } from '@/components/ui';
import IconLink from '@/components/ui/IconLink';
import { experiences } from '@/data';
import { formatDuration, monthsBetween } from '@/lib/experience-duration';
import type { Experience, ExperienceGroup, ExperienceItem } from '@/types';
import { LockKeyhole } from 'lucide-react';
import ExperienceCollapse from './ExperienceCollapse';
import LiveDuration from './LiveDuration';
import LogoMark from './LogoMark';
import ProjectVideo from './ProjectVideo';
import ProjectImagePreview from './ProjectImagePreview';
import WorkLearningGallery from './WorkLearningGallery';

function Projects({ id, label, projects, gallery, nested }: { id: string; label: string; projects: NonNullable<Experience['projects']>; gallery?: Experience['projectGallery']; nested?: boolean }) {
  const headingId = `${id}-projects`;
  const Label = nested ? 'h5' : 'h4';
  const Name = nested ? 'h6' : 'h5';

  return (
    <section className="xp-projects" aria-labelledby={headingId}>
      <Label className="xp-label" id={headingId}>{label} <span aria-hidden="true">· {String(projects.length).padStart(2, '0')}</span></Label>
      <ol className="xp-projects__list">
        {projects.map((proj, i) => (
          <li key={proj.name} className={proj.url || proj.image ? 'xp-projects__item--linked' : undefined}>
            <span className="xp-projects__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <Name>{proj.name}</Name>
            <p>{proj.description}</p>
            {proj.visibility && (
              <p className={`project-status xp-projects__status project-status--${proj.visibility}`}>
                {proj.visibility === 'confidential' && <LockKeyhole aria-hidden="true" size={14} strokeWidth={1.8} />}
                <span>{proj.visibility === 'confidential' ? 'Internal Project · Confidential' : 'Professional Development'}</span>
              </p>
            )}
            {proj.video && (
              <div className="xp-projects__media">
                <ProjectVideo name={proj.name} video={proj.video} />
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
                {proj.linkLabel ?? (proj.video ? 'Watch Demo' : 'View Project')}<span className="sr-only">: {proj.name} (opens in a new tab)</span>
              </IconLink>
            )}
          </li>
        ))}
      </ol>
      {gallery?.length ? <WorkLearningGallery images={gallery} /> : null}
    </section>
  );
}

function Period({ xp }: { xp: Pick<Experience, 'start' | 'end'> }) {
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

const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const itemName = (item: ExperienceItem) => ('roles' in item ? item.employer : item.role);
const itemId = (item: ExperienceItem) => `xp-${item.start.iso}-${slug(itemName(item))}`;

function Mark({ item }: { item: Pick<Experience, 'logo' | 'mark' | 'markIcon'> }) {
  return <LogoMark logo={item.logo} mark={item.mark} icon={item.markIcon} />;
}

/** Employment type, workplace type and duration. Education carries no duration. */
function Facts({ xp }: { xp: Pick<Experience, 'start' | 'end' | 'employmentType' | 'workplaceType' | 'kind' | 'hideDuration'> }) {
  const months = monthsBetween(xp.start.iso, xp.end?.iso);
  return (
    <ul className="xp-facts">
      {xp.employmentType && <li>{xp.employmentType}</li>}
      {xp.workplaceType && <li>{xp.workplaceType}</li>}
      {xp.kind !== 'education' && !xp.hideDuration && (
        <li>
          <span className="sr-only">Duration: </span>
          {xp.end ? formatDuration(months) : <LiveDuration startIso={xp.start.iso} initial={formatDuration(months)} />}
        </li>
      )}
    </ul>
  );
}

function Skills({ skills }: { skills?: string[] }) {
  if (!skills?.length) return null;
  return (
    <ul className="xp-skills" aria-label="Skills">
      {skills.map((skill) => <li key={skill}>{skill}</li>)}
    </ul>
  );
}

function Details({ id, xp, nested, defaultOpen }: { id: string; xp: Experience; nested?: boolean; defaultOpen?: boolean }) {
  const label = xp.kind === 'education' ? 'Qualifications' : xp.projects ? 'Responsibilities & projects' : 'Responsibilities';
  return (
    <ExperienceCollapse id={`${id}-details`} label={label} name={xp.role} defaultOpen={defaultOpen}>
      <ul className="xp-bullets">
        {xp.bullets.map((b) => <li key={b}>{b}</li>)}
      </ul>
      {xp.projects && <Projects id={id} label={xp.projectsLabel ?? 'Projects'} projects={xp.projects} gallery={xp.projectGallery} nested={nested} />}
    </ExperienceCollapse>
  );
}

function Entry({ xp, id, defaultOpen }: { xp: Experience; id: string; defaultOpen?: boolean }) {
  const org = xp.company ?? xp.description;
  return (
    <article className="xp-entry" id={id} aria-labelledby={`${id}-title`}>
      <header className="xp-head">
        <Mark item={xp} />
        <div className="xp-head__text">
          <h3 id={`${id}-title`}>{xp.role}</h3>
          <p className="xp-meta">
            {org && <span className="xp-org">{xp.website ? <a href={xp.website} target="_blank" rel="noopener noreferrer">{org}<span className="sr-only"> (opens in a new tab)</span></a> : org}</span>}
            {org && xp.location && <span className="xp-sep" aria-hidden="true">/</span>}
            {xp.location && <span className="xp-location">{xp.location}</span>}
          </p>
          <Facts xp={xp} />
        </div>
      </header>
      <Skills skills={xp.skills} />
      <Details id={id} xp={xp} defaultOpen={defaultOpen} />
    </article>
  );
}

/** One employer, several roles: the employer is the h3, each role an h4 beneath it. */
function Group({ group, id }: { group: ExperienceGroup; id: string }) {
  return (
    <article className="xp-entry xp-group" id={id} aria-labelledby={`${id}-title`}>
      <header className="xp-head">
        <Mark item={group} />
        <div className="xp-head__text">
          <h3 id={`${id}-title`}>{group.employer}</h3>
          <p className="xp-meta"><span className="xp-location">{group.location}</span></p>
          <Facts xp={group} />
        </div>
      </header>
      <ExperienceCollapse id={`${id}-roles`} label={`${group.roles.length} roles`} name={group.employer} defaultOpen>
        <ol className="xp-roles">
          {group.roles.map((role) => {
            const roleId = `${id}-${slug(role.role)}`;
            return (
              <li key={role.role} className="xp-role" aria-labelledby={`${roleId}-title`}>
                <h4 id={`${roleId}-title`}>{role.role}</h4>
                <Period xp={role} />
                <p className="xp-meta"><span className="xp-location">{role.location}</span></p>
                <Facts xp={{ ...role, employmentType: undefined }} />
                <Skills skills={role.skills} />
                <Details id={roleId} xp={role} nested />
              </li>
            );
          })}
        </ol>
      </ExperienceCollapse>
    </article>
  );
}

const data: TimelineEntry[] = experiences.map((item, index) => {
  const id = itemId(item);
  return {
    id,
    title: <Period xp={item} />,
    content: 'roles' in item ? <Group group={item} id={id} /> : <Entry xp={item} id={id} defaultOpen={index === 0} />,
    className: item.end ? undefined : 'is-current',
  };
});

/** Chronological jump links, newest first, matching the timeline order. */
export function TimelineNav() {
  return (
    <nav className="xp-nav" aria-label="Career timeline">
      <ol>
        {experiences.map((item) => (
          <li key={itemId(item)}>
            <a href={`#${itemId(item)}`}>
              <span className="xp-nav__year">{item.start.iso.slice(0, 4)}</span>
              {'roles' in item ? item.employer : item.navLabel ?? item.role}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function ExperienceTimeline() {
  return <Timeline data={data} />;
}
