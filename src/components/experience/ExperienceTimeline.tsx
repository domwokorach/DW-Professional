import { LinkIcon } from '@/components/animate-ui/icons/link';
import { Timeline, type TimelineEntry } from '@/components/ui';
import IconLink from '@/components/ui/IconLink';
import { education, experiences } from '@/data';
import { formatDuration, monthsBetween } from '@/lib/experience-duration';
import type { Experience, ExperienceGroup, ExperienceItem } from '@/types';
import ExperienceCollapse from './ExperienceCollapse';
import ExperienceInsights, { type InsightBlock } from './ExperienceInsights';
import LiveDuration from './LiveDuration';
import LogoMark from './LogoMark';
import ProjectVideo from './ProjectVideo';
import UITransformationTerminalPreview from './UITransformationTerminalPreview';
import HTMLEmailPreview from './html-email/HTMLEmailPreview';
import InnovationCommunityPreview from './innovation-graph/InnovationCommunityPreview';
import { renderAllEmails } from './html-email/email-templates';
import TimelineNavLinks, { type TimelineNavItem } from './TimelineNav';
import DigitalBankingTestingPreview from './DigitalBankingTestingPreview';
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
          <li key={proj.name} className={proj.preview ? 'xp-projects__item--preview' : proj.url || proj.image ? 'xp-projects__item--linked' : undefined}>
            <span className="xp-projects__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <Name>{proj.name}</Name>
            {proj.category && <p className="xp-projects__category">{proj.category}</p>}
            <p>{proj.description}</p>
            {proj.visibility === 'professional-development' && (
              <p className="project-status xp-projects__status project-status--professional-development">
                <span>Professional Development</span>
              </p>
            )}
            {proj.preview === 'digital-banking-testing' && (
              <div className="xp-projects__preview" role="group" aria-labelledby={`${headingId}-${i}-preview`}>
                <p className="xp-label" id={`${headingId}-${i}-preview`}>Preview</p>
                <DigitalBankingTestingPreview />
              </div>
            )}
            {proj.video && (
              <div className="xp-projects__media">
                <ProjectVideo name={proj.name} video={proj.video} />
              </div>
            )}
            {proj.image && <ProjectImagePreview name={proj.name} image={proj.image} />}
            {proj.preview === 'html-email' && (
              <div className="xp-projects__feature" role="group" aria-label={`${proj.name}: interactive email preview`}>
                <HTMLEmailPreview templates={renderAllEmails()} />
                {proj.insights && (
                  <ExperienceInsights
                    id={`${id}-html-email`}
                    nested
                    blocks={[
                      { key: 'responsibilities', heading: 'Responsibilities', items: proj.insights.responsibilities },
                      ...(proj.insights.challenges ? [{ key: 'challenges' as const, heading: 'Problems & Challenges', items: proj.insights.challenges }] : []),
                      ...(proj.insights.achievements ? [{ key: 'achievements' as const, heading: 'Achievements', items: proj.insights.achievements }] : []),
                    ]}
                  />
                )}
              </div>
            )}
            {proj.preview === 'innovation-graph' && (
              <div className="xp-projects__feature" role="group" aria-labelledby={`${id}-innovation-graph-preview`}>
                <p className="xp-label" id={`${id}-innovation-graph-preview`}>Preview</p>
                <InnovationCommunityPreview />
                {proj.insights && (
                  <ExperienceInsights
                    id={`${id}-innovation-graph`}
                    nested
                    blocks={[
                      { key: 'responsibilities', heading: 'Responsibilities', items: proj.insights.responsibilities },
                      ...(proj.insights.challenges ? [{ key: 'challenges' as const, heading: 'Problems & Challenges', items: proj.insights.challenges }] : []),
                      ...(proj.insights.achievements ? [{ key: 'achievements' as const, heading: 'Achievements', items: proj.insights.achievements }] : []),
                    ]}
                  />
                )}
              </div>
            )}
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

function Period({ xp }: { xp: Pick<Experience, 'start' | 'end' | 'dateLabel'> }) {
  if (xp.dateLabel) return <p className="xp-date"><span className="xp-present">{xp.dateLabel}</span></p>;
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
function Facts({ xp, progression }: { xp: Pick<Experience, 'start' | 'end' | 'employmentType' | 'workplaceType' | 'hideDuration'>; progression?: number }) {
  const months = monthsBetween(xp.start.iso, xp.end?.iso);
  return (
    <ul className="xp-facts">
      {xp.employmentType && <li>{xp.employmentType}</li>}
      {xp.workplaceType && <li>{xp.workplaceType}</li>}
      {!xp.hideDuration && (
        <li>
          <span className="sr-only">Duration: </span>
          {xp.end ? formatDuration(months) : <LiveDuration startIso={xp.start.iso} initial={formatDuration(months)} />}
        </li>
      )}
      {progression ? <li>Career progression: {progression} roles</li> : null}
    </ul>
  );
}

function Preview({ id, nested }: { id: string; nested?: boolean }) {
  const headingId = `${id}-preview`;
  const Label = nested ? 'h5' : 'h4';
  return (
    <section className="xp-preview" aria-labelledby={headingId}>
      <Label className="xp-label" id={headingId}>Preview <span aria-hidden="true">· Interactive developer terminal</span></Label>
      <UITransformationTerminalPreview />
    </section>
  );
}

function Skills({ skills, label = 'Skills' }: { skills?: string[]; label?: string }) {
  if (!skills?.length) return null;
  return (
    <ul className="xp-skills" aria-label={label}>
      {skills.map((skill) => <li key={skill}>{skill}</li>)}
    </ul>
  );
}

function Details({ id, xp, nested, defaultOpen }: { id: string; xp: Experience; nested?: boolean; defaultOpen?: boolean }) {
  const structured = xp.kind !== 'education' && Boolean(xp.challenges?.length || xp.achievements?.length);
  const label = structured ? 'Responsibilities, challenges & achievements' : xp.kind === 'education' ? 'Qualifications' : xp.projects ? 'Responsibilities & projects' : 'Responsibilities';
  const blocks: InsightBlock[] = [
    { key: 'responsibilities', heading: xp.responsibilitiesLabel ?? (xp.kind === 'education' ? 'Qualifications' : 'Responsibilities'), items: xp.responsibilities },
    ...(xp.challenges?.length ? [{ key: 'challenges' as const, heading: xp.challengesLabel ?? 'Problems & Challenges', items: xp.challenges }] : []),
    ...(xp.achievements?.length ? [{ key: 'achievements' as const, heading: xp.achievementsLabel ?? 'Achievements', items: xp.achievements }] : []),
  ];
  return (
    <ExperienceCollapse id={`${id}-details`} label={label} name={xp.role} defaultOpen={defaultOpen}>
      {structured ? (
        <ExperienceInsights id={id} blocks={blocks} nested={nested} />
      ) : (
        <ul className="xp-bullets">
          {xp.responsibilities.map((b) => <li key={b}>{b}</li>)}
        </ul>
      )}
      {xp.projects && <Projects id={id} label={xp.projectsLabel ?? 'Projects'} projects={xp.projects} gallery={xp.projectGallery} nested={nested} />}
      {xp.preview === 'ui-transformation-terminal' && <Preview id={id} nested={nested} />}
    </ExperienceCollapse>
  );
}

export function Entry({ xp, id, defaultOpen, level = 3 }: { xp: Experience; id: string; defaultOpen?: boolean; level?: 3 | 4 }) {
  const org = xp.company ?? xp.description;
  const Title = `h${level}` as const;
  return (
    <article className={`xp-entry${xp.kind ? ` xp-entry--${xp.kind}` : ''}`} id={id} aria-labelledby={`${id}-title`}>
      <header className="xp-head">
        <Mark item={xp} />
        <div className="xp-head__text">
          <Title id={`${id}-title`}>{xp.role}</Title>
          <p className="xp-meta">
            {org && <span className="xp-org">{xp.website ? <a href={xp.website} target="_blank" rel="noopener noreferrer">{org}<span className="sr-only"> (opens in a new tab)</span></a> : org}</span>}
            {org && xp.location && <span className="xp-sep" aria-hidden="true">/</span>}
            {xp.location && <span className="xp-location">{xp.location}</span>}
          </p>
          <Facts xp={xp} />
        </div>
      </header>
      <Skills skills={xp.skills} label={xp.skillsLabel} />
      <Details id={id} xp={xp} defaultOpen={defaultOpen} nested={level === 4} />
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
          <Facts xp={group} progression={group.roles.length} />
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
  const items: TimelineNavItem[] = [
    ...experiences.map((item) => ({ id: itemId(item), year: 'dateLabel' in item && item.dateLabel ? 'Now' : item.start.iso.slice(0, 4), label: 'roles' in item ? item.employer : item.navLabel ?? item.role })),
    { id: 'xp-education', year: education[0]?.start.iso.slice(0, 4) ?? '', label: 'Education' },
  ];
  return <TimelineNavLinks items={items} />;
}

/** Academic qualifications: a dated entry of its own, not part of the employment timeline. */
export function EducationEntries() {
  return (
    <div className="xp-education__list">
      {education.map((xp) => {
        const id = `xp-${xp.start.iso}-${slug(xp.role)}`;
        return (
          <div key={id} className="xp-education__item">
            <Period xp={xp} />
            <Entry xp={xp} id={id} level={4} defaultOpen />
          </div>
        );
      })}
    </div>
  );
}

export default function ExperienceTimeline() {
  return <Timeline data={data} />;
}
