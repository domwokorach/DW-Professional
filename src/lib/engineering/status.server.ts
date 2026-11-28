import { checkFromRun, parseReportDescription, stateFromDeployment, stateFromJenkins } from './parse';
import { DEFAULT_BRANCH, REPO_NAME, REPO_OWNER, REPO_URL } from './types';
import type { Check, EngineeringStatus, TestReport } from './types';

// Server-only. GITHUB_TOKEN (optional, raises the rate limit) and the Jenkins credentials are read here and nowhere
// else, so they never reach a browser bundle, the Expo app, the HTML or a log line. Everything is read-only.
const API = 'https://api.github.com';
const TIMEOUT_MS = 5000;
/** Status changes on pushes and runs; five minutes keeps us far below GitHub's unauthenticated limit. */
export const REVALIDATE_SECONDS = 300;
/** CI publishes real report numbers under this commit-status context (see .github/workflows/ci.yml). */
export const REPORT_CONTEXT = 'engineering/test-report';
const DEPLOY_ENVIRONMENT = 'Production';

let lastGood: EngineeringStatus | null = null;
let blockedUntil = 0;

class Upstream extends Error {}

async function github<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'dw-professional-engineering-status' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`${API}${path}`, { headers, signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: REVALIDATE_SECONDS } });
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    const retryAfter = Number(res.headers.get('retry-after'));
    blockedUntil = Date.now() + (retryAfter ? retryAfter * 1000 : reset ? Math.max(0, reset * 1000 - Date.now()) : 5 * 60_000);
    throw new Upstream('rate limited');
  }
  if (!res.ok) throw new Upstream(`GitHub ${res.status}`);
  return (await res.json()) as T;
}

interface Run {
  id: number; head_sha: string; status: string | null; conclusion: string | null; html_url: string; updated_at: string;
  head_commit?: { message?: string; timestamp?: string } | null;
}

async function jenkins(): Promise<Check> {
  const base = process.env.JENKINS_URL?.replace(/\/+$/, '');
  const job = process.env.JENKINS_JOB;
  if (!base || !job) return { state: 'not_configured', detail: 'Jenkins is local and is not exposed to the public site' };
  try {
    const headers: Record<string, string> = {};
    if (process.env.JENKINS_USER && process.env.JENKINS_API_TOKEN) {
      headers.Authorization = `Basic ${Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_API_TOKEN}`).toString('base64')}`;
    }
    const url = `${base}/job/${encodeURIComponent(job)}/lastBuild/api/json?tree=result,building,number,timestamp`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' });
    if (!res.ok) return { state: 'unavailable', detail: 'Jenkins did not answer' };
    const build = (await res.json()) as { result?: string | null; building?: boolean; number?: number; timestamp?: number };
    return { state: stateFromJenkins(build), detail: build.number ? `Build #${build.number}` : undefined, updatedAt: build.timestamp ? new Date(build.timestamp).toISOString() : undefined };
  } catch {
    return { state: 'unavailable', detail: 'Jenkins is unreachable from the public site' };
  }
}

async function fetchFresh(): Promise<EngineeringStatus> {
  const repo = `/repos/${REPO_OWNER}/${REPO_NAME}`;
  const runs = `${repo}/actions/workflows/ci.yml/runs?branch=${DEFAULT_BRANCH}&exclude_pull_requests=true&per_page=1`;
  const [latest, success, deployments, jenkinsCheck] = await Promise.all([
    github<{ workflow_runs: Run[] }>(runs),
    github<{ workflow_runs: Run[] }>(`${runs}&status=success`),
    github<{ id: number }[]>(`${repo}/deployments?environment=${DEPLOY_ENVIRONMENT}&per_page=1`).catch((e) => { if (e instanceof Upstream) throw e; return [] as { id: number }[]; }),
    jenkins(),
  ]);

  const run = latest.workflow_runs[0] ?? null;
  const good = success.workflow_runs[0] ?? null;

  let deployment: Check = { state: 'not_configured', detail: 'No production deployment reported to GitHub' };
  if (deployments[0]) {
    const statuses = await github<{ state: string; target_url?: string; created_at: string }[]>(`${repo}/deployments/${deployments[0].id}/statuses?per_page=1`);
    if (statuses[0]) deployment = { state: stateFromDeployment(statuses[0].state), detail: statuses[0].state, url: statuses[0].target_url || undefined, updatedAt: statuses[0].created_at };
  }

  let report: TestReport | null = null;
  if (good) {
    const statuses = await github<{ context: string; description: string | null; created_at: string }[]>(`${repo}/commits/${good.head_sha}/statuses?per_page=30`).catch((e) => { if (e instanceof Upstream) throw e; return []; });
    const published = statuses.find((s) => s.context === REPORT_CONTEXT);
    if (published) report = parseReportDescription(published.description, good.head_sha, published.created_at);
  }

  const head = run ?? good;
  return {
    fetchedAt: new Date().toISOString(),
    stale: false,
    commit: head
      ? { sha: head.head_sha, shortSha: head.head_sha.slice(0, 7), url: `${REPO_URL}/commit/${head.head_sha}`, message: (head.head_commit?.message ?? '').split('\n')[0].slice(0, 120), committedAt: head.head_commit?.timestamp ?? head.updated_at }
      : null,
    ci: checkFromRun(run),
    lastSuccessfulBuild: good ? { at: good.updated_at, url: good.html_url, sha: good.head_sha } : null,
    deployment,
    jenkins: jenkinsCheck,
    report,
  };
}

/** Fresh status, or the last good one flagged `stale` when GitHub is rate-limited or down. Throws only if there has never been a good answer. */
export async function getEngineeringStatus(): Promise<EngineeringStatus> {
  if (Date.now() < blockedUntil && lastGood) return { ...lastGood, stale: true };
  try {
    lastGood = await fetchFresh();
    return lastGood;
  } catch (error) {
    if (lastGood) return { ...lastGood, stale: true };
    throw error;
  }
}

/** The "nothing is known" answer: every check unavailable, no numbers. Used when GitHub has never answered. */
export function unavailableStatus(): EngineeringStatus {
  const unavailable: Check = { state: 'unavailable' };
  return { fetchedAt: new Date().toISOString(), stale: false, commit: null, ci: unavailable, lastSuccessfulBuild: null, deployment: unavailable, jenkins: { state: 'not_configured', detail: 'Jenkins is local and is not exposed to the public site' }, report: null };
}
