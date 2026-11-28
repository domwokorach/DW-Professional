// Browser / React Native fetcher for the contributions endpoint. Holds no secret: the server route owns GITHUB_TOKEN.
import type { ContributionsErrorBody, ContributionsErrorCode, ContributionsPayload } from './types';

export type ContributionsResult =
  | { ok: true; data: ContributionsPayload }
  | { ok: false; code: ContributionsErrorCode | 'network'; retryAfter?: number };

const isPayload = (v: unknown): v is ContributionsPayload => {
  const p = v as Partial<ContributionsPayload> | null;
  return !!p && Array.isArray(p.calendar?.weeks) && typeof p.calendar?.totalContributions === 'number' && Array.isArray(p.availableYears) && typeof p.period === 'object';
};

/** `origin` is '' on the website (same origin) and the site origin in the Expo app. `year` null = rolling 12 months. */
export async function fetchContributions(year: number | null, { origin = '', signal }: { origin?: string; signal?: AbortSignal } = {}): Promise<ContributionsResult> {
  try {
    const res = await fetch(`${origin}/api/github/contributions${year === null ? '' : `?year=${year}`}`, { signal, headers: { Accept: 'application/json' } });
    const body: unknown = await res.json().catch(() => null);
    if (res.ok && isPayload(body)) return { ok: true, data: body };
    const error = (body as ContributionsErrorBody | null)?.error;
    return { ok: false, code: error?.code ?? 'upstream', retryAfter: error?.retryAfter };
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    return { ok: false, code: 'network' };
  }
}

/** The five legend steps with the real count range each covers in this calendar (GitHub levels are relative quartiles). */
export function levelRanges(calendar: ContributionsPayload['calendar']): ({ min: number; max: number } | null)[] {
  const names = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
  return names.map((name) => {
    let min = Infinity;
    let max = -Infinity;
    for (const w of calendar.weeks) for (const d of w.contributionDays) {
      if (d.contributionLevel !== name) continue;
      min = Math.min(min, d.contributionCount);
      max = Math.max(max, d.contributionCount);
    }
    return max < 0 ? null : { min, max };
  });
}

export const rangeText = (r: { min: number; max: number } | null, level: number) =>
  level === 0 ? 'No contributions' : r ? (r.min === r.max ? `${r.min} contribution${r.min === 1 ? '' : 's'}` : `${r.min}–${r.max} contributions`) : 'Not used in this period';
