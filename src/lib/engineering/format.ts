import type { Check, CheckState, EngineeringStatus } from './types';
import type { StatusKey } from '@/data/engineering';

const WHEN = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const formatWhen = (iso: string | undefined) => (iso && !Number.isNaN(Date.parse(iso)) ? `${WHEN.format(new Date(iso))} UTC` : '—');

/** Data older than this is called out as stale even when the server did not flag it. */
export const STALE_AFTER_MS = 60 * 60 * 1000;
export const isStale = (status: Pick<EngineeringStatus, 'stale' | 'fetchedAt'>, now = Date.now()) =>
  status.stale || now - Date.parse(status.fetchedAt) > STALE_AFTER_MS;

/** The check a card reports, or null for cards that have no live check. */
export function checkFor(status: EngineeringStatus | null, key: StatusKey | undefined): { state: CheckState; detail?: string; url?: string } | null {
  if (!key) return null;
  if (!status) return { state: 'unavailable' };
  switch (key) {
    case 'ci': return status.ci;
    case 'jenkins': return status.jenkins;
    case 'deployment': return status.deployment;
    case 'commit':
      return status.commit ? { state: 'passed', detail: status.commit.shortSha, url: status.commit.url } : { state: 'unavailable' };
    case 'report': {
      const r = status.report;
      if (!r) return { state: 'not_configured', detail: 'No report published yet' } satisfies Check;
      return { state: r.tests.failed > 0 ? 'failed' : 'passed', detail: `${r.tests.passed}/${r.tests.total} tests · ${r.coverage.lines}% lines` };
    }
  }
}
