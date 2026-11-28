'use client';

import { useState } from 'react';
import { GITHUB_PROFILE_URL } from '@/lib/github/types';
import type { ContributionsErrorCode } from '@/lib/github/types';
import ContributionCalendar from './ContributionCalendar';
import ContributionLegend from './ContributionLegend';
import ContributionSkeleton from './ContributionSkeleton';
import ContributionStats from './ContributionStats';
import ContributionYearSelector from './ContributionYearSelector';
import GitHubProfileLink from './GitHubProfileLink';
import { useContributions } from './use-contributions';

const MESSAGES: Record<ContributionsErrorCode | 'network', string> = {
  not_configured: 'The live calendar isn’t connected yet. It will appear here as soon as it is.',
  rate_limited: 'GitHub is limiting requests right now. Please try again in a few minutes.',
  unauthorized: 'The GitHub connection needs attention. Please check back soon.',
  not_found: 'No GitHub activity was found for that period.',
  year_unavailable: 'No GitHub activity was recorded for that year.',
  invalid_request: 'That period isn’t available.',
  upstream: 'GitHub activity is temporarily unavailable.',
  network: 'Couldn’t reach the server. Check your connection and try again.',
};

/** `origin` is '' on the website and the site origin when the same component runs inside the Expo web build elsewhere. */
export default function GitHubActivitySection({ origin = '' }: { origin?: string }) {
  const [year, setYear] = useState<number | null>(null);
  const state = useContributions(year, origin);
  const data = state.data;
  const loading = state.status === 'loading';
  const total = data?.calendar.totalContributions ?? 0;

  return (
    <section id="github" className="section github-section" aria-labelledby="github-heading">
      <div className="section-tag"><i />GITHUB ACTIVITY</div>
      <div className="section-heading">
        <h2 id="github-heading">Consistency in <em>code.</em></h2>
        <p>A visual record of building, learning and contributing — one day at a time.</p>
      </div>

      <div className="gh-card">
        <div className="gh-toolbar">
          {data ? <ContributionYearSelector years={data.availableYears} value={year} onChange={setYear} /> : <span />}
          <GitHubProfileLink />
        </div>

        {!data && state.status === 'loading' ? <ContributionSkeleton /> : null}

        {!data && state.status === 'error' ? (
          <div className="gh-message" role="alert">
            <p>{MESSAGES[state.code]}</p>
            <div>
              {state.code !== 'not_configured' ? <button type="button" className="gh-retry" onClick={state.retry}>Try again</button> : null}
              <a className="gh-retry gh-retry--ghost" href={GITHUB_PROFILE_URL} target="_blank" rel="noopener noreferrer">View GitHub profile<span className="sr-only"> (opens in a new tab)</span></a>
            </div>
          </div>
        ) : null}

        {data ? (
          <div className="gh-body" aria-busy={loading || undefined}>
            <div className="gh-view" data-loading={loading || undefined} key={`${data.period.kind}-${data.period.year}`}>
              <ContributionCalendar calendar={data.calendar} busy={loading} />
              {total === 0 ? <p className="gh-note" role="status">No public contributions in this period yet.</p> : null}
              <div className="gh-foot">
                <p className="gh-note">
                  {data.stale ? `Showing saved data from ${new Date(data.fetchedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}; GitHub is temporarily unavailable. ` : null}
                  Counts follow my GitHub profile’s visibility settings; private repository details are never shown.
                </p>
                <ContributionLegend calendar={data.calendar} />
              </div>
              {state.status === 'error' ? (
                <p className="gh-note gh-note--error" role="alert">{MESSAGES[state.code]} Showing {data.period.kind === 'year' ? data.period.year : 'the last 12 months'} instead. <button type="button" className="gh-link" onClick={state.retry}>Try again</button></p>
              ) : null}
            </div>
            <ContributionStats data={data} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
