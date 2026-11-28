'use client';

import { ExternalLink } from 'lucide-react';
import { capabilities, engineeringLinks, repoUrl } from '@/data/engineering';
import { checkFor, formatWhen, isStale } from '@/lib/engineering/format';
import { useEngineeringStatus } from './use-engineering-status';
import EngineeringIcon from './EngineeringIcon';
import StatusPill from './StatusPill';

const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>;

export default function EngineeringCards({ origin = '' }: { origin?: string }) {
  const state = useEngineeringStatus(origin);
  const status = state.phase === 'ready' ? state.data : null;
  const stale = status ? isStale(status) : false;

  return (
    <>
      <ol className="eng-grid">
        {capabilities.map((c) => {
          const check = state.phase === 'loading' ? null : checkFor(status, c.statusKey);
          return (
            <li key={c.id} className="eng-card">
              <div className="eng-card__top">
                <span className="eng-card__num" aria-hidden="true">{c.number}</span>
                <EngineeringIcon name={c.icon} />
              </div>
              <h3 className="eng-card__title"><span className="sr-only">{c.number}. </span>{c.title}</h3>
              <p className="eng-card__text">{c.description}</p>
              <div className="eng-card__foot">
                {c.statusKey && (
                  <p className="eng-card__status">
                    <StatusPill state={check ? check.state : 'checking'} stale={stale} />
                    {check?.detail && <span className="eng-card__detail">{check.detail}</span>}
                  </p>
                )}
                <a className="eng-link" href={repoUrl(c.link)} target="_blank" rel="noopener noreferrer">
                  {c.link.label}<ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />{NEW_TAB}
                </a>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="eng-live" aria-labelledby="eng-live-heading">
        <h3 id="eng-live-heading" className="eng-live__title">Live status</h3>
        <dl className="eng-live__list">
          <Row term="Latest CI run" value={state.phase === 'loading' ? <StatusPill state="checking" /> : <Linked check={status?.ci ?? { state: 'unavailable' }} stale={stale} />} when={status?.ci.updatedAt} />
          <Row term="Last successful build" value={status?.lastSuccessfulBuild ? <a className="eng-link" href={status.lastSuccessfulBuild.url} target="_blank" rel="noopener noreferrer">{status.lastSuccessfulBuild.sha.slice(0, 7)}{NEW_TAB}</a> : <Muted loading={state.phase === 'loading'} />} when={status?.lastSuccessfulBuild?.at} />
          <Row term="Latest commit" value={status?.commit ? <a className="eng-link" href={status.commit.url} target="_blank" rel="noopener noreferrer"><code>{status.commit.shortSha}</code> {status.commit.message}{NEW_TAB}</a> : <Muted loading={state.phase === 'loading'} />} when={status?.commit?.committedAt} />
          <Row term="Production deployment" value={state.phase === 'loading' ? <StatusPill state="checking" /> : <Linked check={status?.deployment ?? { state: 'unavailable' }} stale={stale} />} when={status?.deployment.updatedAt} />
          <Row term="Jenkins" value={state.phase === 'loading' ? <StatusPill state="checking" /> : <Linked check={status?.jenkins ?? { state: 'unavailable' }} stale={stale} />} when={status?.jenkins.updatedAt} />
          <Row
            term="Tests and coverage"
            value={status?.report
              ? <span>{status.report.tests.passed} of {status.report.tests.total} tests passed ({status.report.tests.skipped} skipped, {status.report.tests.failed} failed) · lines {status.report.coverage.lines}% · branches {status.report.coverage.branches}% · functions {status.report.coverage.functions}%</span>
              : <Muted loading={state.phase === 'loading'} text="No report published for the latest successful build" />}
            when={status?.report?.verifiedAt}
          />
        </dl>
        <p className="eng-live__note" role="status">
          {state.phase === 'loading' && 'Checking live status…'}
          {state.phase === 'error' && 'Live status is unavailable right now. Nothing on this page is guessed.'}
          {status && (stale ? `Showing stale data. Last verified ${formatWhen(status.fetchedAt)}.` : `Last verified ${formatWhen(status.fetchedAt)}.`)}
        </p>
      </section>

      <nav className="eng-actions" aria-label="Engineering links">
        <ul>
          {engineeringLinks.map((l) => (
            <li key={l.label}>
              <a className="eng-cta" href={l.href ?? repoUrl(l)} target="_blank" rel="noopener noreferrer">
                {l.label}<ExternalLink size={15} strokeWidth={1.5} aria-hidden="true" />{NEW_TAB}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

function Row({ term, value, when }: { term: string; value: React.ReactNode; when?: string }) {
  return (
    <div className="eng-live__row">
      <dt>{term}</dt>
      <dd>{value}{when && <span className="eng-live__when"> · {formatWhen(when)}</span>}</dd>
    </div>
  );
}

function Linked({ check, stale }: { check: { state: Parameters<typeof StatusPill>[0]['state']; detail?: string; url?: string }; stale: boolean }) {
  const pill = <StatusPill state={check.state} stale={stale} />;
  return (
    <>
      {check.url ? <a className="eng-link" href={check.url} target="_blank" rel="noopener noreferrer">{pill}{NEW_TAB}</a> : pill}
      {check.detail && <span className="eng-live__when"> · {check.detail}</span>}
    </>
  );
}

function Muted({ loading, text = 'Not available' }: { loading: boolean; text?: string }) {
  return loading ? <StatusPill state="checking" /> : <span className="eng-muted">{text}</span>;
}
