import {
  addDays,
  parseCalendar,
  utcDate,
  type ContributionData,
  type ContributionErrorCode,
  type ContributionResponse,
  GITHUB_USERNAME,
} from './github-contributions';

/**
 * Server-side GitHub GraphQL integration (user → contributionsCollection → contributionCalendar).
 * GITHUB_TOKEN stays on the server: it is read here only, never sent to a client or bundled into Expo.
 * Use a fine-grained token with no extra permissions (public data); a classic token with `read:user` also works.
 */

const ENDPOINT = 'https://api.github.com/graphql';
export const REVALIDATE_SECONDS = 60 * 60;

const QUERY = `query($login:String!,$from:DateTime,$to:DateTime){
  user(login:$login){
    contributionsCollection(from:$from,to:$to){
      contributionYears
      contributionCalendar{
        totalContributions
        weeks{contributionDays{contributionCount contributionLevel date weekday color}}
      }
    }
  }
}`;

export const githubConfigured = () => Boolean(process.env.GITHUB_TOKEN?.trim());

/** Last good response per period: a fallback when GitHub is unreachable or rate limited (per server instance). */
const lastGood = new Map<string, ContributionData>();
/** When GitHub tells us to stop, do not ask again until then (epoch ms). */
let blockedUntil = 0;

export type FetchLike = typeof fetch;

/** `year` is a four-digit year, or null for the rolling last 12 months. */
export function periodFor(year: number | null, now = new Date()) {
  if (year === null) {
    const to = utcDate(now);
    // 52 full weeks plus today's week is GitHub's own default window; ask for exactly one year back.
    const from = addDays(utcDate(new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()))), 1);
    return { key: 'rolling', from, to };
  }
  const end = year === now.getUTCFullYear() ? utcDate(now) : `${year}-12-31`;
  return { key: String(year), from: `${year}-01-01`, to: end };
}

class GitHubError extends Error {
  constructor(readonly code: ContributionErrorCode) {
    super(code);
  }
}

async function fetchFromGitHub(year: number | null, fetchImpl: FetchLike, now: Date): Promise<ContributionData> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) throw new GitHubError('not_configured');
  if (Date.now() < blockedUntil) throw new GitHubError('rate_limited');

  const period = periodFor(year, now);
  const variables = { login: GITHUB_USERNAME, from: `${period.from}T00:00:00Z`, to: `${period.to}T23:59:59Z` };
  let res: Response;
  try {
    res = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'dw-professional-portfolio' },
      body: JSON.stringify({ query: QUERY, variables }),
      // Cached by Next's data cache and revalidated hourly. Never includes the token in the cache key's response.
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new GitHubError('unavailable');
  }

  if (res.status === 403 || res.status === 429) {
    const retry = Number(res.headers.get('retry-after'));
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (res.status === 429 || remaining === '0' || retry > 0) {
      const waitMs = retry > 0 ? retry * 1000 : reset > 0 ? Math.max(0, reset * 1000 - Date.now()) : 60_000;
      blockedUntil = Date.now() + Math.min(waitMs, 15 * 60_000);
      throw new GitHubError('rate_limited');
    }
  }
  if (!res.ok) throw new GitHubError('unavailable');

  const json = (await res.json()) as {
    data?: { user: { contributionsCollection: { contributionYears?: number[]; contributionCalendar: unknown } } | null };
    errors?: { type?: string }[];
  };
  if (json.errors?.some((e) => e.type === 'RATE_LIMITED')) {
    blockedUntil = Date.now() + 60_000;
    throw new GitHubError('rate_limited');
  }
  if (json.errors?.some((e) => e.type === 'NOT_FOUND') || (json.data && json.data.user === null)) throw new GitHubError('not_found');
  const collection = json.data?.user?.contributionsCollection;
  if (!collection) throw new GitHubError('unavailable');

  let parsed;
  try {
    parsed = parseCalendar(collection.contributionCalendar);
  } catch {
    throw new GitHubError('unavailable');
  }
  const years = (collection.contributionYears ?? []).filter((y) => Number.isInteger(y)).sort((a, b) => b - a);
  return { login: GITHUB_USERNAME, period, total: parsed.total, weeks: parsed.weeks, years, fetchedAt: now.toISOString() };
}

/** Contribution data for a year (or null = rolling 12 months), with a stale copy as fallback. Never throws. */
export async function getContributions(year: number | null, fetchImpl: FetchLike = fetch, now = new Date()): Promise<ContributionResponse> {
  const key = year === null ? 'rolling' : String(year);
  try {
    const data = await fetchFromGitHub(year, fetchImpl, now);
    lastGood.set(key, data);
    return { data };
  } catch (e) {
    const code = e instanceof GitHubError ? e.code : 'unavailable';
    const cached = lastGood.get(key);
    if (cached && code !== 'not_configured') return { data: cached, stale: true, error: code };
    return { error: code };
  }
}

/** Test helper: forget cached data and rate-limit state. */
export function resetGitHubState() {
  lastGood.clear();
  blockedUntil = 0;
}
