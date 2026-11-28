import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { fetchContributions, levelRanges } from '../src/lib/github/client';
import { computeStats, describeDay, flattenDays, monthMarkers, toCells } from '../src/lib/github/stats';
import type { ContributionCalendar, ContributionDay, ContributionLevelName } from '../src/lib/github/types';

const LEVEL: ContributionLevelName[] = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** A calendar of consecutive UTC days starting on `start`, one count per day, grouped into Sunday-first weeks. */
function calendar(start: string, counts: number[]): ContributionCalendar {
  const t0 = Date.parse(`${start}T00:00:00Z`);
  const days: ContributionDay[] = counts.map((contributionCount, i) => ({
    date: iso(t0 + i * 86_400_000),
    contributionCount,
    contributionLevel: LEVEL[Math.min(4, Math.ceil(contributionCount / 3))],
    weekday: new Date(t0 + i * 86_400_000).getUTCDay(),
    color: '#000',
  }));
  const weeks: ContributionCalendar['weeks'] = [];
  for (const d of days) {
    if (!weeks.length || d.weekday === 0) weeks.push({ contributionDays: [] });
    weeks[weeks.length - 1].contributionDays.push(d);
  }
  return { totalContributions: counts.reduce((a, b) => a + b, 0), weeks };
}

test('totals, active days, most active day and period come straight from the calendar', () => {
  const s = computeStats(calendar('2026-03-01', [0, 2, 0, 5, 1, 0, 0]), '2026-12-31');
  assert.equal(s.total, 8);
  assert.equal(s.activeDays, 3);
  assert.equal(s.totalDays, 7);
  assert.deepEqual(s.mostActiveDay, { date: '2026-03-04', count: 5 });
  assert.deepEqual(s.range, { start: '2026-03-01', end: '2026-03-07' });
});

test('longest streak is the longest run of consecutive active days, with its dates', () => {
  const s = computeStats(calendar('2026-03-01', [1, 1, 0, 1, 1, 1, 1, 0, 1]), '2026-12-31');
  assert.equal(s.longestStreak, 4);
  assert.deepEqual(s.longestStreakRange, { start: '2026-03-04', end: '2026-03-07' });
});

test('current streak counts back from the last day', () => {
  assert.equal(computeStats(calendar('2026-03-01', [0, 1, 1, 1]), '2026-12-31').currentStreak, 3);
  assert.equal(computeStats(calendar('2026-03-01', [1, 1, 1, 0]), '2026-12-31').currentStreak, 0);
});

test('a quiet day that is still today does not break the current streak', () => {
  assert.equal(computeStats(calendar('2026-03-01', [1, 1, 1, 0]), '2026-03-04').currentStreak, 3);
  // …but only for today itself.
  assert.equal(computeStats(calendar('2026-03-01', [1, 1, 1, 0, 0]), '2026-03-05').currentStreak, 0);
});

test('streaks cross month and year boundaries on UTC dates', () => {
  const s = computeStats(calendar('2025-12-30', [1, 1, 1, 1]), '2026-12-31');
  assert.equal(s.longestStreak, 4);
  assert.deepEqual(s.longestStreakRange, { start: '2025-12-30', end: '2026-01-02' });
});

test('an empty calendar yields zeros, no fabricated activity', () => {
  const s = computeStats(calendar('2026-03-01', [0, 0, 0]), '2026-12-31');
  assert.deepEqual([s.total, s.activeDays, s.currentStreak, s.longestStreak, s.mostActiveDay], [0, 0, 0, 0, null]);
  const none = computeStats({ totalContributions: 0, weeks: [] }, '2026-12-31');
  assert.equal(none.range, null);
  assert.equal(none.totalDays, 0);
});

test('days after today are ignored', () => {
  const cal = calendar('2026-03-01', [1, 1, 9, 9]);
  assert.equal(flattenDays(cal, '2026-03-02').length, 2);
  assert.equal(computeStats(cal, '2026-03-02').total, 2);
});

test('day descriptions are exact and unambiguous', () => {
  assert.equal(describeDay({ date: '2026-03-04', contributionCount: 5 }), '5 contributions on Wednesday, 4 March 2026');
  assert.equal(describeDay({ date: '2026-03-04', contributionCount: 1 }), '1 contribution on Wednesday, 4 March 2026');
  assert.equal(describeDay({ date: '2026-03-04', contributionCount: 0 }), 'No contributions on Wednesday, 4 March 2026');
});

test('cells keep their week column and weekday row; month labels do not collide', () => {
  const cal = calendar('2026-03-04', Array(70).fill(1));
  const cells = toCells(cal, '2026-12-31');
  assert.equal(cells.length, 70);
  assert.equal(cells[0].row, 3);
  assert.equal(cells[0].week, 0);
  const markers = monthMarkers(cal);
  assert.deepEqual(markers.map((m) => m.label), ['Mar', 'Apr', 'May']);
  assert.ok(markers.every((m, i) => i === 0 || m.week - markers[i - 1].week >= 3));
});

test('legend ranges report the real counts behind each level', () => {
  const r = levelRanges(calendar('2026-03-01', [0, 1, 2, 3, 4, 6, 10, 12]));
  assert.deepEqual(r[0], { min: 0, max: 0 });
  assert.deepEqual(r[1], { min: 1, max: 3 });
  assert.deepEqual(r[4], { min: 10, max: 12 });
});

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });
const respond = (status: number, body: unknown) => { globalThis.fetch = (async () => new Response(JSON.stringify(body), { status })) as typeof fetch; };

test('client: a valid payload is returned, API errors map to their code, network failure is reported', async () => {
  const payload = { login: 'x', profileUrl: 'u', period: { kind: 'rolling', year: null }, availableYears: [2026], calendar: calendar('2026-03-01', [1]), fetchedAt: 'now', stale: false };
  respond(200, payload);
  const ok = await fetchContributions(null);
  assert.ok(ok.ok && ok.data.availableYears[0] === 2026);

  respond(429, { error: { code: 'rate_limited', message: 'x', retryAfter: 30 } });
  assert.deepEqual(await fetchContributions(2025), { ok: false, code: 'rate_limited', retryAfter: 30 });

  respond(200, { nonsense: true });
  assert.deepEqual(await fetchContributions(null), { ok: false, code: 'upstream', retryAfter: undefined });

  globalThis.fetch = (async () => { throw new TypeError('offline'); }) as typeof fetch;
  assert.deepEqual(await fetchContributions(null), { ok: false, code: 'network' });
});

test('client: the year goes in the query string, rolling sends none', async () => {
  const urls: string[] = [];
  globalThis.fetch = (async (u: string) => { urls.push(u); return new Response('{}', { status: 500 }); }) as unknown as typeof fetch;
  await fetchContributions(null, { origin: 'https://site.test' });
  await fetchContributions(2024);
  assert.deepEqual(urls, ['https://site.test/api/github/contributions', '/api/github/contributions?year=2024']);
});

// Server integration: token handling, rate limits, stale fallback, validation.
const day = (date: string, n: number) => ({ contributionCount: n, contributionLevel: 'FIRST_QUARTILE', date, weekday: 1, color: '#fff' });
const graphql = (years = [2026, 2025]) => ({ data: { user: { contributionsCollection: { contributionYears: years, contributionCalendar: { totalContributions: 3, weeks: [{ contributionDays: [day('2026-03-02', 3)] }] } } } } });

test('server: no token = not_configured, and GitHub is never called', async () => {
  const { getContributions } = await import('../src/lib/github/contributions.server');
  const saved = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  let called = false;
  globalThis.fetch = (async () => { called = true; return new Response('{}'); }) as typeof fetch;
  await assert.rejects(getContributions(null), { code: 'not_configured' });
  assert.equal(called, false);
  if (saved) process.env.GITHUB_TOKEN = saved;
});

test('server: token goes only in the Authorization header; bad years are rejected; unlisted years are unavailable', async () => {
  const { getContributions } = await import('../src/lib/github/contributions.server');
  process.env.GITHUB_TOKEN = 'ghp_test_token';
  let init: RequestInit | undefined;
  globalThis.fetch = (async (_u: string, i: RequestInit) => { init = i; return new Response(JSON.stringify(graphql())); }) as unknown as typeof fetch;
  const rolling = await getContributions(null);
  assert.equal((init!.headers as Record<string, string>).Authorization, 'Bearer ghp_test_token');
  assert.ok(!init!.body!.toString().includes('ghp_test_token'));
  assert.ok(!JSON.stringify(rolling).includes('ghp_test_token'));
  assert.equal(rolling.stale, false);
  assert.deepEqual(rolling.period, { kind: 'rolling', year: null });
  await assert.rejects(getContributions(1999), { code: 'invalid_request' });
  await assert.rejects(getContributions(2020), { code: 'year_unavailable' });
  const y = await getContributions(2025);
  assert.deepEqual(y.period, { kind: 'year', year: 2025 });
  assert.match(JSON.parse(init!.body!.toString()).variables.from, /^2025-01-01T/);
});

test('server: an outage serves the last good copy flagged stale; a rate limit pauses calls and reports retryAfter', async () => {
  const { getContributions } = await import('../src/lib/github/contributions.server');
  process.env.GITHUB_TOKEN = 'ghp_test_token';
  globalThis.fetch = (async () => new Response(JSON.stringify(graphql([2026, 2025, 2024])))) as unknown as typeof fetch;
  await getContributions(2024);
  globalThis.fetch = (async () => new Response('boom', { status: 502 })) as unknown as typeof fetch;
  const stale = await getContributions(2024);
  assert.equal(stale.stale, true);
  await assert.rejects(getContributions(2023), { code: 'upstream' });

  let calls = 0;
  globalThis.fetch = (async () => { calls += 1; return new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0', 'retry-after': '120' } }); }) as unknown as typeof fetch;
  await assert.rejects(getContributions(2022), (e: { code: string; retryAfter?: number }) => e.code === 'rate_limited' && e.retryAfter === 120);
  assert.equal(calls, 1);
  assert.equal((await getContributions(2024)).stale, true);
  await assert.rejects(getContributions(2021), { code: 'rate_limited' });
  assert.equal(calls, 1, 'no further GitHub calls while blocked');
});
