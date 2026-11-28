// Server-only: GITHUB_TOKEN is read here and nowhere else, so it never reaches a browser bundle, the Expo app, the
// HTML or a log line. Uses GitHub's official GraphQL API (user → contributionsCollection → contributionCalendar);
// nothing is scraped and no third-party contribution API is involved.
import { GITHUB_LOGIN, GITHUB_PROFILE_URL } from './types';
import type { ContributionCalendar, ContributionDay, ContributionLevelName, ContributionsErrorCode, ContributionsPayload } from './types';

const ENDPOINT = 'https://api.github.com/graphql';
/** Contributions change a few times a day at most; hourly is plenty and keeps one request per window per period. */
export const REVALIDATE_SECONDS = 60 * 60;
const FIRST_GITHUB_YEAR = 2008;

const QUERY = `query ($login: String!, $from: DateTime, $to: DateTime) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionYears
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount contributionLevel date weekday color } }
      }
    }
  }
}`;

export class GitHubError extends Error {
  constructor(readonly code: ContributionsErrorCode, message: string, readonly retryAfter?: number) {
    super(message);
  }
}

/** Last good payload per period, served (flagged `stale`) when GitHub is rate-limited or down. Per instance. */
const lastGood = new Map<string, ContributionsPayload>();
/** After a rate limit, don't hammer GitHub until it resets. */
let blockedUntil = 0;

const LEVEL_NAMES = new Set<ContributionLevelName>(['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE']);
const isIsoDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Validates the response shape before anything reaches a client; returns null when it is not what we asked for. */
function parseCollection(data: unknown): { years: number[]; calendar: ContributionCalendar } | null {
  const c = (data as { data?: { user?: { contributionsCollection?: Record<string, unknown> } | null } })?.data?.user?.contributionsCollection;
  const cal = c?.contributionCalendar as { totalContributions?: unknown; weeks?: unknown } | undefined;
  if (!c || !cal || typeof cal.totalContributions !== 'number' || !Array.isArray(cal.weeks) || !Array.isArray(c.contributionYears)) return null;
  const weeks: ContributionCalendar['weeks'] = [];
  for (const w of cal.weeks as { contributionDays?: unknown }[]) {
    if (!Array.isArray(w?.contributionDays)) return null;
    const days: ContributionDay[] = [];
    for (const d of w.contributionDays as Partial<ContributionDay>[]) {
      if (!isIsoDate(d.date) || typeof d.contributionCount !== 'number' || d.contributionCount < 0
        || !LEVEL_NAMES.has(d.contributionLevel as ContributionLevelName) || typeof d.weekday !== 'number' || typeof d.color !== 'string') return null;
      days.push({ date: d.date, contributionCount: d.contributionCount, contributionLevel: d.contributionLevel as ContributionLevelName, weekday: d.weekday, color: d.color });
    }
    weeks.push({ contributionDays: days });
  }
  const years = (c.contributionYears as unknown[]).filter((y): y is number => Number.isInteger(y)).sort((a, b) => b - a);
  return { years, calendar: { totalContributions: cal.totalContributions, weeks } };
}

/** Seconds until GitHub's rate limit resets, from its headers (Retry-After, else X-RateLimit-Reset). */
function retryAfterSeconds(res: Response): number {
  const retry = Number(res.headers.get('retry-after'));
  if (retry > 0) return Math.ceil(retry);
  const reset = Number(res.headers.get('x-ratelimit-reset'));
  if (reset > 0) return Math.max(1, Math.ceil(reset - Date.now() / 1000));
  return 60;
}

export const isValidYear = (year: number, now = new Date()) => Number.isInteger(year) && year >= FIRST_GITHUB_YEAR && year <= now.getUTCFullYear();

async function fetchFromGitHub(year: number | null, token: string): Promise<ContributionsPayload> {
  const variables: Record<string, string> = { login: GITHUB_LOGIN };
  // No range = GitHub's rolling last 12 months. A year is asked for whole (the API caps a range at one year).
  if (year !== null) { variables.from = `${year}-01-01T00:00:00Z`; variables.to = `${year}-12-31T23:59:59Z`; }

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json', 'User-Agent': 'dw-professional-portfolio' },
      body: JSON.stringify({ query: QUERY, variables }),
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new GitHubError('upstream', 'GitHub could not be reached.');
  }

  if (res.status === 401) throw new GitHubError('unauthorized', 'GitHub rejected the access token.');
  const limited = res.status === 429 || (res.status === 403 && (res.headers.get('x-ratelimit-remaining') === '0' || res.headers.has('retry-after')));
  if (limited) throw new GitHubError('rate_limited', 'GitHub rate limit reached.', retryAfterSeconds(res));
  if (!res.ok) throw new GitHubError('upstream', `GitHub responded ${res.status}.`);

  let body: unknown;
  try { body = await res.json(); } catch { throw new GitHubError('upstream', 'GitHub sent an unreadable response.'); }
  const errors = (body as { errors?: { type?: string }[] }).errors;
  if (errors?.some((e) => e.type === 'RATE_LIMITED')) throw new GitHubError('rate_limited', 'GitHub rate limit reached.', retryAfterSeconds(res));
  if (errors?.some((e) => e.type === 'NOT_FOUND')) throw new GitHubError('not_found', 'GitHub user not found.');
  const parsed = parseCollection(body);
  if (!parsed) throw new GitHubError('upstream', 'GitHub sent an unexpected response.');

  return {
    login: GITHUB_LOGIN,
    profileUrl: GITHUB_PROFILE_URL,
    period: { kind: year === null ? 'rolling' : 'year', year },
    availableYears: parsed.years,
    calendar: parsed.calendar,
    fetchedAt: new Date().toISOString(),
    stale: false,
  };
}

/**
 * The contribution calendar for the rolling 12 months (`year` null) or one calendar year. Falls back to the last good
 * copy (flagged `stale`) on a rate limit or outage; throws a GitHubError when there is nothing to fall back on.
 */
export async function getContributions(year: number | null = null): Promise<ContributionsPayload> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) throw new GitHubError('not_configured', 'GitHub activity is not configured.');
  if (year !== null && !isValidYear(year)) throw new GitHubError('invalid_request', 'Unsupported year.');

  const key = year === null ? 'rolling' : String(year);
  const cached = lastGood.get(key);
  const serveStale = (error: GitHubError) => {
    if (!cached) throw error;
    return { ...cached, stale: true };
  };

  if (Date.now() < blockedUntil) return serveStale(new GitHubError('rate_limited', 'GitHub rate limit reached.', Math.ceil((blockedUntil - Date.now()) / 1000)));

  try {
    const payload = await fetchFromGitHub(year, token);
    if (year !== null && !payload.availableYears.includes(year)) throw new GitHubError('year_unavailable', 'No GitHub activity for that year.');
    lastGood.set(key, payload);
    return payload;
  } catch (error) {
    if (!(error instanceof GitHubError)) throw new GitHubError('upstream', 'GitHub request failed.');
    if (error.code === 'rate_limited') blockedUntil = Date.now() + (error.retryAfter ?? 60) * 1000;
    // Only the code is logged: never the token, request or response.
    console.warn(`[github] contributions ${key}: ${error.code}`);
    if (error.code === 'upstream' || error.code === 'rate_limited') return serveStale(error);
    throw error;
  }
}
