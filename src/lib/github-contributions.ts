/**
 * GitHub contribution calendar: types and pure calculations, shared by the website and the Expo app (no Node, DOM or
 * React imports). All dates are UTC calendar days ("YYYY-MM-DD"), exactly as GitHub reports them.
 */

export const GITHUB_USERNAME = 'domwokorach';
export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  /** UTC date, YYYY-MM-DD. */
  date: string;
  count: number;
  level: ContributionLevel;
  /** 0 = Sunday … 6 = Saturday (GitHub's `weekday`). */
  weekday: number;
  /** GitHub's own colour for the cell (informational; the UI colours cells from the site's tokens). */
  color: string;
}

export interface ContributionWeek { days: ContributionDay[] }

export interface ContributionPeriod {
  /** First and last day covered, YYYY-MM-DD (UTC). */
  from: string;
  to: string;
  /** The selected year, or `rolling` for the last 12 months. */
  key: string;
}

export interface ContributionData {
  login: string;
  period: ContributionPeriod;
  /** GitHub's own total for the period. */
  total: number;
  weeks: ContributionWeek[];
  /** Years with contribution history, newest first. */
  years: number[];
  /** ISO time the data was fetched from GitHub. */
  fetchedAt: string;
}

export type ContributionErrorCode = 'not_configured' | 'rate_limited' | 'not_found' | 'unavailable' | 'invalid_request';

export interface ContributionResponse {
  data?: ContributionData;
  /** True when `data` is an earlier copy served because GitHub could not be reached. */
  stale?: boolean;
  error?: ContributionErrorCode;
}

export interface ContributionStats {
  total: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  /** The day with the most contributions (the earliest if several tie); null when there was no activity. */
  mostActive: { date: string; count: number } | null;
  /** True for the rolling period, where the streak is the one running now. */
  streakIsCurrent: boolean;
}

const LEVELS: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export const levelFromGitHub = (v: unknown): ContributionLevel => (typeof v === 'string' && v in LEVELS ? LEVELS[v] : 0);

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isIsoDate = (s: string) => DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
export const utcDate = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (date: string, n: number) => utcDate(new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS));
export const weekdayOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const formatLongDate = (date: string) => dateFmt.format(new Date(`${date}T00:00:00Z`)).replace(',', '');
export const formatShortDate = (date: string) => shortFmt.format(new Date(`${date}T00:00:00Z`));
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const describeDay = (day: Pick<ContributionDay, 'date' | 'count'>) =>
  `${day.count === 0 ? 'No contributions' : `${day.count} contribution${day.count === 1 ? '' : 's'}`} on ${formatLongDate(day.date)}`;

export const describePeriod = (p: ContributionPeriod) => `${formatShortDate(p.from)} – ${formatShortDate(p.to)}`;

export const flattenDays = (weeks: ContributionWeek[]) => weeks.flatMap((w) => w.days).sort((a, b) => (a.date < b.date ? -1 : 1));

/**
 * Totals and streaks for the reported days. A streak is a run of consecutive UTC days with at least one contribution.
 * The current streak ends on the last reported day; as on GitHub, an empty last day (today, not yet contributed to)
 * does not break a streak that ran up to the day before.
 */
export function computeStats(days: ContributionDay[], total: number, rolling: boolean): ContributionStats {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1));
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  let mostActive: ContributionStats['mostActive'] = null;
  let activeDays = 0;
  for (const d of sorted) {
    if (d.count > 0) {
      activeDays++;
      run = prev !== null && addDays(prev, 1) === d.date && run > 0 ? run + 1 : 1;
      longest = Math.max(longest, run);
      if (!mostActive || d.count > mostActive.count) mostActive = { date: d.date, count: d.count };
    } else run = 0;
    prev = d.date;
  }
  // Streak ending at the last reported day (or the day before it, when that last day is still empty).
  let current = 0;
  let i = sorted.length - 1;
  if (i >= 0 && sorted[i].count === 0) i--;
  for (; i >= 0 && sorted[i].count > 0; i--) {
    current++;
    if (i > 0 && addDays(sorted[i - 1].date, 1) !== sorted[i].date) break;
  }
  return { total, activeDays, currentStreak: current, longestStreak: longest, mostActive, streakIsCurrent: rolling };
}

/** Month label positions: the week index where each new month first appears (skipping a label squeezed against the previous). */
export function monthLabels(weeks: ContributionWeek[]): { week: number; label: string }[] {
  const out: { week: number; label: string }[] = [];
  let last = -1;
  weeks.forEach((w, i) => {
    const first = w.days[0];
    if (!first) return;
    const m = Number(first.date.slice(5, 7)) - 1;
    if (m !== last) {
      // The first partial week of a month only labels it when the month actually starts in that week.
      if (out.length === 0 || i - out[out.length - 1].week >= 3) out.push({ week: i, label: MONTHS[m] });
      last = m;
    }
  });
  return out;
}

/** Parses GitHub's GraphQL `contributionCalendar` into our types. Throws on an unexpected shape. */
export function parseCalendar(raw: unknown): { total: number; weeks: ContributionWeek[] } {
  const c = raw as { totalContributions?: unknown; weeks?: { contributionDays?: Record<string, unknown>[] }[] } | null;
  if (!c || typeof c.totalContributions !== 'number' || !Array.isArray(c.weeks)) throw new Error('Unexpected calendar shape');
  const weeks = c.weeks.map((w) => ({
    days: (w.contributionDays ?? []).map((d) => {
      const date = String(d.date);
      const count = Number(d.contributionCount);
      if (!isIsoDate(date) || !Number.isInteger(count) || count < 0) throw new Error('Unexpected contribution day');
      return { date, count, level: levelFromGitHub(d.contributionLevel), weekday: Number(d.weekday), color: String(d.color ?? '') };
    }),
  }));
  return { total: c.totalContributions, weeks };
}
