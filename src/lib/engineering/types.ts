// Shared by the server fetcher, the API route, the website and (as JSON) the Expo app.
export const REPO_OWNER = 'domwokorach';
export const REPO_NAME = 'DW-Professional';
export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
export const DEFAULT_BRANCH = 'master';

export type CheckState = 'passed' | 'failed' | 'running' | 'pending' | 'cancelled' | 'not_configured' | 'unavailable';

export interface Check {
  state: CheckState;
  /** Human-readable detail, e.g. the workflow conclusion. Never contains credentials. */
  detail?: string;
  url?: string;
  /** ISO timestamp the upstream system reported for this check. */
  updatedAt?: string;
}

export interface TestReport {
  tests: { total: number; passed: number; failed: number; skipped: number };
  /** Percentages from the real coverage-summary.json (c8). */
  coverage: { lines: number; branches: number; functions: number };
  /** Commit the report was produced for, and when CI published it. */
  sha: string;
  verifiedAt: string;
}

export interface EngineeringStatus {
  /** When this server last got a fresh answer from upstream. */
  fetchedAt: string;
  /** True when upstream failed and this is the last good answer. */
  stale: boolean;
  commit: { sha: string; shortSha: string; url: string; message: string; committedAt: string } | null;
  ci: Check;
  lastSuccessfulBuild: { at: string; url: string; sha: string } | null;
  deployment: Check;
  jenkins: Check;
  report: TestReport | null;
}

export const STATUS_LABELS: Record<CheckState, string> = {
  passed: 'Passed',
  failed: 'Failed',
  running: 'Running',
  pending: 'Pending',
  cancelled: 'Cancelled',
  not_configured: 'Not configured',
  unavailable: 'Unavailable',
};
