// Pure contribution maths, shared by the website and the Expo app. Everything works on UTC calendar dates
// (YYYY-MM-DD) so a visitor's time zone can never shift a day or break a streak.
import type { ContributionCalendar, ContributionDay, ContributionLevel, ContributionLevelName, ContributionStats } from './types';

const DAY_MS = 86_400_000;
const LEVELS: Record<ContributionLevelName, ContributionLevel> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

export const levelOf = (name: ContributionLevelName): ContributionLevel => LEVELS[name] ?? 0;

export const parseUtcDate = (date: string) => Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
export const toIsoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const todayUtc = (now: Date = new Date()) => toIsoDate(now.getTime());
/** Whole days from `a` to `b` (positive when b is later). */
export const dayDiff = (a: string, b: string) => Math.round((parseUtcDate(b) - parseUtcDate(a)) / DAY_MS);

const dateFormat = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options });
const LONG = dateFormat({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const MEDIUM = dateFormat({ day: 'numeric', month: 'short', year: 'numeric' });
const MONTH = dateFormat({ month: 'short' });

export const formatLongDate = (date: string) => LONG.format(parseUtcDate(date));
export const formatShortDate = (date: string) => MEDIUM.format(parseUtcDate(date));
export const monthLabel = (date: string) => MONTH.format(parseUtcDate(date));

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

/** "No contributions on Monday, 4 March 2024" / "3 contributions on …" — the text screen readers and tooltips share. */
export function describeDay(day: Pick<ContributionDay, 'date' | 'contributionCount'>) {
  const count = day.contributionCount === 0 ? 'No contributions' : plural(day.contributionCount, 'contribution');
  return `${count} on ${formatLongDate(day.date)}`;
}

/** Every day of the calendar in date order, ignoring days after `today` (the API never sends them; this is a guard). */
export function flattenDays(calendar: ContributionCalendar, today = todayUtc()): ContributionDay[] {
  return calendar.weeks.flatMap((w) => w.contributionDays).filter((d) => d.date <= today).sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * Statistics for one reporting period, from real calendar days only.
 * - Current streak: consecutive active days ending at the period's last day. A zero on that last day does not break it
 *   when it is today (the day is still in progress), matching how GitHub counts.
 * - Longest streak: the longest run of consecutive active days anywhere in the period.
 */
export function computeStats(calendar: ContributionCalendar, today = todayUtc()): ContributionStats {
  const days = flattenDays(calendar, today);
  if (days.length === 0) {
    return { total: calendar.totalContributions, activeDays: 0, totalDays: 0, currentStreak: 0, longestStreak: 0, longestStreakRange: null, mostActiveDay: null, range: null };
  }

  let activeDays = 0;
  let longest = 0;
  let longestRange: ContributionStats['longestStreakRange'] = null;
  let run = 0;
  let runStart = '';
  let prevActive = '';
  let most: ContributionStats['mostActiveDay'] = null;
  let total = 0;

  for (const day of days) {
    total += day.contributionCount;
    if (day.contributionCount > (most?.count ?? 0)) most = { date: day.date, count: day.contributionCount };
    if (day.contributionCount <= 0) continue;
    activeDays += 1;
    if (prevActive && dayDiff(prevActive, day.date) === 1) run += 1;
    else { run = 1; runStart = day.date; }
    prevActive = day.date;
    if (run > longest) { longest = run; longestRange = { start: runStart, end: day.date }; }
  }

  // Walk back from the last day.
  let current = 0;
  let cursor = days.length - 1;
  if (days[cursor].contributionCount === 0 && days[cursor].date === today) cursor -= 1;
  for (; cursor >= 0 && days[cursor].contributionCount > 0; cursor -= 1) {
    if (current > 0 && dayDiff(days[cursor].date, days[cursor + 1].date) !== 1) break;
    current += 1;
  }

  const range = { start: days[0].date, end: days[days.length - 1].date };
  return {
    total: Math.max(total, 0),
    activeDays,
    totalDays: dayDiff(range.start, range.end) + 1,
    currentStreak: current,
    longestStreak: longest,
    longestStreakRange: longestRange,
    mostActiveDay: most,
    range,
  };
}

/** Where a day sits in the grid: week column (0-based) and weekday row (0 = Sunday). */
export interface CalendarCell { day: ContributionDay; week: number; row: number; level: ContributionLevel }

export function toCells(calendar: ContributionCalendar, today = todayUtc()): CalendarCell[] {
  return calendar.weeks.flatMap((w, week) => w.contributionDays
    .filter((d) => d.date <= today)
    .map((day) => ({ day, week, row: day.weekday, level: levelOf(day.contributionLevel) })));
}

/** A month label at the first week column that contains the 1st (or the first column, if it starts mid-month and has room). */
export function monthMarkers(calendar: ContributionCalendar): { week: number; label: string }[] {
  const out: { week: number; label: string }[] = [];
  let lastMonth = '';
  calendar.weeks.forEach((w, week) => {
    const first = w.contributionDays[0];
    if (!first) return;
    const month = first.date.slice(0, 7);
    if (month === lastMonth) return;
    lastMonth = month;
    out.push({ week, label: monthLabel(first.date) });
  });
  // A label squeezed against the next one (a two-day first week) is dropped so labels never collide.
  return out.filter((m, i) => i > 0 || !out[1] || out[1].week - m.week >= 3);
}

export const rangeLabel = (range: ContributionStats['range']) => (range ? `${formatShortDate(range.start)} – ${formatShortDate(range.end)}` : '');
