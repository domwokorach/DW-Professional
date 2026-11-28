// Pure mapping from upstream payloads to our states. No I/O, so it is unit-tested with real payload shapes.
import type { Check, CheckState, TestReport } from './types';

interface WorkflowRun {
  status?: string | null;
  conclusion?: string | null;
  html_url?: string;
  updated_at?: string;
  run_started_at?: string;
}

/** GitHub Actions run → state. `status` is queued/in_progress/completed; `conclusion` only exists once completed. */
export function stateFromRun(run: Pick<WorkflowRun, 'status' | 'conclusion'>): CheckState {
  switch (run.status) {
    case 'completed':
      switch (run.conclusion) {
        case 'success': return 'passed';
        case 'cancelled': return 'cancelled';
        case 'skipped':
        case 'neutral': return 'cancelled';
        case 'failure':
        case 'timed_out':
        case 'startup_failure':
        case 'action_required': return 'failed';
        default: return 'unavailable';
      }
    case 'in_progress': return 'running';
    case 'queued':
    case 'waiting':
    case 'requested':
    case 'pending': return 'pending';
    default: return 'unavailable';
  }
}

export function checkFromRun(run: WorkflowRun | null | undefined): Check {
  if (!run) return { state: 'unavailable', detail: 'No workflow runs found' };
  return {
    state: stateFromRun(run),
    detail: run.status === 'completed' ? run.conclusion ?? undefined : run.status ?? undefined,
    url: run.html_url,
    updatedAt: run.updated_at,
  };
}

/** GitHub deployment status `state` → our state (Vercel reports through the Deployments API). */
export function stateFromDeployment(state: string | undefined): CheckState {
  switch (state) {
    case 'success': return 'passed';
    case 'failure':
    case 'error': return 'failed';
    case 'in_progress': return 'running';
    case 'queued':
    case 'pending': return 'pending';
    case 'inactive': return 'cancelled';
    default: return 'unavailable';
  }
}

/** Jenkins `lastBuild` → state. `result` is null while building. */
export function stateFromJenkins(build: { building?: boolean; result?: string | null }): CheckState {
  if (build.building) return 'running';
  switch (build.result) {
    case 'SUCCESS': return 'passed';
    case 'UNSTABLE':
    case 'FAILURE': return 'failed';
    case 'ABORTED':
    case 'NOT_BUILT': return 'cancelled';
    default: return 'unavailable';
  }
}

/**
 * CI publishes the numbers from its real JUnit and coverage reports as a commit status description:
 *   "tests=97 passed=97 failed=0 skipped=0 lines=14.62 branches=64.05 functions=33.64"
 * Anything that does not parse into every field is rejected, so a partial or edited description never
 * shows as a result.
 */
export function parseReportDescription(description: string | null | undefined, sha: string, verifiedAt: string): TestReport | null {
  if (!description) return null;
  const fields = new Map<string, number>();
  for (const part of description.trim().split(/\s+/)) {
    const m = /^([a-z]+)=(\d+(?:\.\d+)?)$/.exec(part);
    if (!m) return null;
    fields.set(m[1], Number(m[2]));
  }
  const need = ['tests', 'passed', 'failed', 'skipped', 'lines', 'branches', 'functions'];
  if (need.some((k) => !fields.has(k))) return null;
  const get = (k: string) => fields.get(k) as number;
  const pct = (k: string) => get(k) >= 0 && get(k) <= 100;
  if (!pct('lines') || !pct('branches') || !pct('functions')) return null;
  if (get('passed') + get('failed') + get('skipped') > get('tests')) return null;
  return {
    tests: { total: get('tests'), passed: get('passed'), failed: get('failed'), skipped: get('skipped') },
    coverage: { lines: get('lines'), branches: get('branches'), functions: get('functions') },
    sha,
    verifiedAt,
  };
}
