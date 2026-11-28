'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { computeStats, flattenDays, formatShortDate, GITHUB_PROFILE_URL } from '@/lib/github-contributions';
import ContributionCalendar from './ContributionCalendar';
import ContributionStats from './ContributionStats';
import GitHubProfileLink from './GitHubProfileLink';
import { useContributions } from './useContributions';

const MESSAGES = {
  not_configured: 'Live contribution data is not connected yet.',
  rate_limited: 'GitHub is rate limiting requests right now. Please try again shortly.',
  not_found: 'This GitHub profile could not be found.',
  unavailable: 'GitHub activity is unavailable right now.',
  invalid_request: 'That reporting period is not available.',
} as const;

/** Real GitHub contribution activity: calendar, statistics and a year picker, loaded through the site's own API. */
export default function GitHubActivitySection({ apiOrigin = '' }: { apiOrigin?: string }) {
  // The calendar always shows the rolling last 12 months.
  const { state, retry } = useContributions('rolling', apiOrigin);
  const reduce = useReducedMotion();
  const ready = state.status === 'ready' ? state : null;
  const stats = useMemo(
    () => (ready ? computeStats(flattenDays(ready.data.weeks), ready.data.total, ready.data.period.key === 'rolling') : null),
    [ready],
  );

  return (
    <section id="github" className="section github-section" aria-labelledby="github-heading" aria-busy={state.status === 'loading'}>
      <div className="section-tag"><i />GITHUB ACTIVITY</div>
      <div className="section-heading">
        <h2 id="github-heading">Consistency in <em>code.</em></h2>
        <p>A visual record of building, learning and contributing — one day at a time.</p>
      </div>

      <div className="gh-card">
        <div className="gh-toolbar">
          <GitHubProfileLink />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state.status === 'ready' ? state.data.period.key : state.status}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: 'easeOut' }}
          >
            {state.status === 'loading' ? (
              <div className="gh-skeleton" role="status" aria-label="Loading GitHub activity">
                <div className="gh-skeleton-grid" aria-hidden="true" />
                <div className="gh-skeleton-stats" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <span key={i} />)}</div>
              </div>
            ) : state.status === 'error' ? (
              <div className="gh-message" role="alert">
                <p>{MESSAGES[state.error]}</p>
                <div>
                  {state.error !== 'not_configured' ? <button type="button" className="gh-retry" onClick={retry}>Try again</button> : null}
                  <a href={GITHUB_PROFILE_URL} target="_blank" rel="noopener noreferrer">View the profile on GitHub<span className="sr-only"> (opens in a new tab)</span></a>
                </div>
              </div>
            ) : (
              <>
                {state.stale ? <p className="gh-note" role="status">Showing saved data from {formatShortDate(state.data.fetchedAt.slice(0, 10))}; GitHub could not be reached.</p> : null}
                <ContributionCalendar data={state.data} />
                {state.data.total === 0 ? <p className="gh-note">No public contributions in this period.</p> : null}
                {stats ? <ContributionStats stats={stats} period={state.data.period} /> : null}
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <p className="gh-fine">Source: GitHub contribution calendar. Private contributions appear only where my GitHub profile shares them. Days are counted in UTC.</p>
      </div>
    </section>
  );
}
