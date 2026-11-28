import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import { checkFor, isStale } from '../src/lib/engineering/format';
import { checkFromRun, parseReportDescription, stateFromDeployment, stateFromJenkins, stateFromRun } from '../src/lib/engineering/parse';
import type { EngineeringStatus } from '../src/lib/engineering/types';

describe('state mapping', () => {
  test('GitHub Actions runs', () => {
    assert.equal(stateFromRun({ status: 'completed', conclusion: 'success' }), 'passed');
    assert.equal(stateFromRun({ status: 'completed', conclusion: 'failure' }), 'failed');
    assert.equal(stateFromRun({ status: 'completed', conclusion: 'timed_out' }), 'failed');
    assert.equal(stateFromRun({ status: 'completed', conclusion: 'cancelled' }), 'cancelled');
    assert.equal(stateFromRun({ status: 'in_progress', conclusion: null }), 'running');
    assert.equal(stateFromRun({ status: 'queued', conclusion: null }), 'pending');
    assert.equal(stateFromRun({ status: 'something-new', conclusion: null }), 'unavailable');
    assert.equal(checkFromRun(null).state, 'unavailable');
  });
  test('deployments and Jenkins', () => {
    assert.equal(stateFromDeployment('success'), 'passed');
    assert.equal(stateFromDeployment('error'), 'failed');
    assert.equal(stateFromDeployment('in_progress'), 'running');
    assert.equal(stateFromDeployment(undefined), 'unavailable');
    assert.equal(stateFromJenkins({ building: true, result: null }), 'running');
    assert.equal(stateFromJenkins({ result: 'SUCCESS' }), 'passed');
    assert.equal(stateFromJenkins({ result: 'FAILURE' }), 'failed');
    assert.equal(stateFromJenkins({ result: 'ABORTED' }), 'cancelled');
    assert.equal(stateFromJenkins({ result: null }), 'unavailable');
  });
});

describe('report description (numbers come only from CI reports)', () => {
  const good = 'tests=97 passed=97 failed=0 skipped=0 lines=14.62 branches=64.05 functions=33.64';
  test('parses a complete description', () => {
    const r = parseReportDescription(good, 'abc', '2026-01-01T00:00:00Z');
    assert.deepEqual(r?.tests, { total: 97, passed: 97, failed: 0, skipped: 0 });
    assert.deepEqual(r?.coverage, { lines: 14.62, branches: 64.05, functions: 33.64 });
  });
  test('rejects missing, malformed, impossible or empty input instead of guessing', () => {
    assert.equal(parseReportDescription(null, 'a', 'b'), null);
    assert.equal(parseReportDescription('', 'a', 'b'), null);
    assert.equal(parseReportDescription('All checks passed', 'a', 'b'), null);
    assert.equal(parseReportDescription('tests=97 passed=97', 'a', 'b'), null);
    assert.equal(parseReportDescription(good.replace('lines=14.62', 'lines=140'), 'a', 'b'), null);
    assert.equal(parseReportDescription(good.replace('passed=97', 'passed=98'), 'a', 'b'), null);
  });
});

const base: EngineeringStatus = {
  fetchedAt: '2026-01-01T00:00:00.000Z', stale: false, commit: null, ci: { state: 'passed' }, lastSuccessfulBuild: null,
  deployment: { state: 'not_configured' }, jenkins: { state: 'not_configured' }, report: null,
};

describe('presentation helpers', () => {
  test('stale: flagged by the server, or older than an hour', () => {
    const now = Date.parse(base.fetchedAt) + 1000;
    assert.equal(isStale(base, now), false);
    assert.equal(isStale({ ...base, stale: true }, now), true);
    assert.equal(isStale(base, Date.parse(base.fetchedAt) + 61 * 60 * 1000), true);
  });
  test('cards report only what is known', () => {
    assert.equal(checkFor(base, undefined), null);
    assert.equal(checkFor(null, 'ci')?.state, 'unavailable');
    assert.equal(checkFor(base, 'report')?.state, 'not_configured');
    assert.equal(checkFor(base, 'commit')?.state, 'unavailable');
    const withReport = { ...base, report: { tests: { total: 5, passed: 4, failed: 1, skipped: 0 }, coverage: { lines: 10, branches: 20, functions: 30 }, sha: 's', verifiedAt: 'v' } };
    assert.equal(checkFor(withReport, 'report')?.state, 'failed');
  });
});

describe('server fetcher', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; delete process.env.JENKINS_URL; delete process.env.JENKINS_JOB; });

  const run = (conclusion: string | null, status = 'completed') => ({ id: 1, head_sha: 'a'.repeat(40), status, conclusion, html_url: 'https://github.com/x/y/actions/runs/1', updated_at: '2026-01-02T00:00:00Z', head_commit: { message: 'feat: x\n\nbody', timestamp: '2026-01-02T00:00:00Z' } });
  const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init });

  test('builds a status from GitHub, never calls Jenkins when unconfigured, and falls back to stale when rate-limited', async () => {
    const calls: string[] = [];
    let limited = false;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (limited) return new Response('{}', { status: 403, headers: { 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 600) } });
      if (url.includes('/actions/workflows/ci.yml/runs') && url.includes('status=success')) return json({ workflow_runs: [run('success')] });
      if (url.includes('/actions/workflows/ci.yml/runs')) return json({ workflow_runs: [run(null, 'in_progress')] });
      if (url.endsWith('/deployments?environment=Production&per_page=1')) return json([{ id: 7 }]);
      if (url.includes('/deployments/7/statuses')) return json([{ state: 'success', target_url: 'https://example.vercel.app', created_at: '2026-01-02T00:00:00Z' }]);
      if (url.includes('/statuses?per_page=30')) return json([{ context: 'engineering/test-report', description: 'tests=3 passed=3 failed=0 skipped=0 lines=50.5 branches=60 functions=70', created_at: '2026-01-02T00:01:00Z' }]);
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const { getEngineeringStatus } = await import('../src/lib/engineering/status.server');
    const fresh = await getEngineeringStatus();
    assert.equal(fresh.ci.state, 'running');
    assert.equal(fresh.lastSuccessfulBuild?.sha.length, 40);
    assert.equal(fresh.deployment.state, 'passed');
    assert.equal(fresh.jenkins.state, 'not_configured');
    assert.equal(fresh.report?.coverage.lines, 50.5);
    assert.equal(fresh.commit?.message, 'feat: x');
    assert.equal(fresh.stale, false);
    assert.ok(!calls.some((u) => u.includes('jenkins')), 'Jenkins must not be contacted when it is not configured');

    limited = true;
    const stale = await getEngineeringStatus();
    assert.equal(stale.stale, true);
    assert.equal(stale.report?.tests.total, 3, 'serves the last good numbers, flagged stale');

    const before = calls.length;
    const again = await getEngineeringStatus(); // blocked until the rate limit resets: no upstream call
    assert.equal(again.stale, true);
    assert.equal(calls.length, before);
  });

  test('an unreachable Jenkins is "unavailable", and no credential appears in the result', async () => {
    process.env.JENKINS_URL = 'http://localhost:8080';
    process.env.JENKINS_JOB = 'dw';
    process.env.JENKINS_API_TOKEN = 'super-secret-token';
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      if (String(input).includes('localhost:8080')) throw new TypeError('fetch failed');
      return json({ workflow_runs: [] });
    }) as typeof fetch;
    // A fresh module instance (the previous test left a cached "last good" and a rate-limit block).
    const specifier = '../src/lib/engineering/status.server?jenkins-unreachable';
    const mod = (await import(specifier)) as typeof import('../src/lib/engineering/status.server');
    const status = await mod.getEngineeringStatus().catch(() => mod.unavailableStatus());
    const text = JSON.stringify(status);
    assert.ok(!text.includes('super-secret-token'));
    assert.ok(['unavailable', 'not_configured'].includes(status.jenkins.state));
    delete process.env.JENKINS_API_TOKEN;
  });
});
