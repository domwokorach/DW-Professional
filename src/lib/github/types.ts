// Shared by the website, the API route and the Expo app. Pure types: safe for every bundle.

export const GITHUB_LOGIN = 'domwokorach';
export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_LOGIN}`;

/** GitHub's GraphQL `ContributionLevel` enum. */
export type ContributionLevelName = 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE';
/** The same five steps as 0 (no activity) to 4 (high activity). */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  /** UTC calendar date, YYYY-MM-DD. */
  date: string;
  contributionCount: number;
  contributionLevel: ContributionLevelName;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  /** GitHub's own green; kept for completeness, the portfolio paints levels with its gold tokens. */
  color: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionPeriod {
  /** `rolling` = GitHub's default last-12-months window; `year` = one calendar year. */
  kind: 'rolling' | 'year';
  year: number | null;
}

/** Body of GET /api/github/contributions on success. */
export interface ContributionsPayload {
  login: string;
  profileUrl: string;
  period: ContributionPeriod;
  /** Years with recorded activity, newest first. */
  availableYears: number[];
  calendar: ContributionCalendar;
  /** ISO time the data was fetched from GitHub. */
  fetchedAt: string;
  /** True when GitHub could not be reached and the last good copy is being served. */
  stale: boolean;
}

export type ContributionsErrorCode = 'not_configured' | 'rate_limited' | 'unauthorized' | 'not_found' | 'year_unavailable' | 'invalid_request' | 'upstream';

export interface ContributionsErrorBody {
  error: { code: ContributionsErrorCode; message: string; retryAfter?: number };
}

export interface ContributionStats {
  total: number;
  activeDays: number;
  /** Days in the period (first to last calendar day). */
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  longestStreakRange: { start: string; end: string } | null;
  mostActiveDay: { date: string; count: number } | null;
  range: { start: string; end: string } | null;
}
