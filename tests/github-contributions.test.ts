import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import {
  addDays,
  computeStats,
  describeDay,
  flattenDays,
  levelFromGitHub,
  monthLabels,
  parseCalendar,
  type ContributionDay,
} from '../src/lib/github-contributions';
import { getContributions, periodFor, resetGitHubState } from '../src/lib/github-contributions.server';

const day = (date: string, count: number): ContributionDay => ({ date, count, level: count ? 1 : 0, weekday: new Date(`${date}T00:00:00Z`).getUTCDay(), color: '#000' });
const run = (start: string, counts: number[]) => counts.map((c, i) => day(addDays(start, i), c));

test('levels map from GitHub enums', () => {
  assert.deepEqual(['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE', 'x'].map(levelFromGitHub), [0, 1, 2, 3, 4, 0]);
});

test('stats: totals, active days, longest streak, most active day', () => {
  const s = computeStats(run('2025-01-01', [1, 2, 0, 3, 5, 1, 0, 0, 4]), 16, false);
  assert.equal(s.total, 16);
  assert.equal(s.activeDays, 6);
  assert.equal(s.longestStreak, 3);
  assert.deepEqual(s.mostActive, { date: '2025-01-05', count: 5 });
  assert.equal(s.currentStreak, 1);
});

test('stats: an empty final day does not break the running streak', () => {
  assert.equal(computeStats(run('2025-03-01', [2, 2, 2, 0]), 6, true).currentStreak, 3);
  assert.equal(computeStats(run('2025-03-01', [2, 2, 0, 0]), 4, true).currentStreak, 0);
});

test('stats: ties pick the earliest day; no activity gives null', () => {
  assert.equal(computeStats(run('2025-01-01', [3, 3]), 6, false).mostActive?.date, '2025-01-01');
  const none = computeStats(run('2025-01-01', [0, 0, 0]), 0, true);
  assert.equal(none.mostActive, null);
  assert.equal(none.longestStreak, 0);
  assert.equal(none.currentStreak, 0);
});

test('stats: streaks cross month and year boundaries; gaps in dates break them', () => {
  assert.equal(computeStats(run('2024-12-30', [1, 1, 1, 1]), 4, false).longestStreak, 4);
  const gap = [day('2025-01-01', 1), day('2025-01-03', 1)];
  assert.equal(computeStats(gap, 2, false).longestStreak, 1);
  assert.equal(computeStats(gap, 2, false).currentStreak, 1);
});

test('dates are UTC and descriptions are exact', () => {
  assert.equal(addDays('2024-02-28', 2), '2024-03-01');
  assert.equal(describeDay({ date: '2025-03-14', count: 1 }), '1 contribution on Friday 14 March 2025');
  assert.equal(describeDay({ date: '2025-03-15', count: 0 }), 'No contributions on Saturday 15 March 2025');
});

test('parseCalendar maps GraphQL and rejects bad shapes', () => {
  const raw = { totalContributions: 3, weeks: [{ contributionDays: [{ contributionCount: 3, contributionLevel: 'SECOND_QUARTILE', date: '2025-03-14', weekday: 5, color: '#c6a667' }] }] };
  const p = parseCalendar(raw);
  assert.equal(p.total, 3);
  assert.deepEqual(flattenDays(p.weeks)[0], { date: '2025-03-14', count: 3, level: 2, weekday: 5, color: '#c6a667' });
  assert.throws(() => parseCalendar({}));
  assert.throws(() => parseCalendar({ totalContributions: 1, weeks: [{ contributionDays: [{ contributionCount: -1, date: '2025-03-14' }] }] }));
  assert.throws(() => parseCalendar({ totalContributions: 1, weeks: [{ contributionDays: [{ contributionCount: 1, date: 'nope' }] }] }));
});

test('month labels sit at month starts without crowding', () => {
  const weeks = Array.from({ length: 10 }, (_, i) => ({ days: [day(addDays('2025-01-05', i * 7), 0)] }));
  const labels = monthLabels(weeks);
  assert.deepEqual(labels.map((l) => l.label), ['Jan', 'Feb', 'Mar']);
});

test('periods: rolling is one year to today; a past year is the full year', () => {
  const now = new Date('2025-06-15T10:00:00Z');
  assert.deepEqual(periodFor(null, now), { key: 'rolling', from: '2024-06-16', to: '2025-06-15' });
  assert.deepEqual(periodFor(2023, now), { key: '2023', from: '2023-01-01', to: '2023-12-31' });
  assert.deepEqual(periodFor(2025, now), { key: '2025', from: '2025-01-01', to: '2025-06-15' });
});

const ok = {
  data: { user: { contributionsCollection: { contributionYears: [2023, 2025, 2024], contributionCalendar: { totalContributions: 2, weeks: [{ contributionDays: [{ contributionCount: 2, contributionLevel: 'FIRST_QUARTILE', date: '2025-06-14', weekday: 6, color: '#c6a667' }] }] } } } },
};
const reply = (body: unknown, init?: ResponseInit) => (async () => new Response(JSON.stringify(body), { status: 200, ...init })) as unknown as typeof fetch;
const now = new Date('2025-06-15T10:00:00Z');

beforeEach(() => {
  resetGitHubState();
  process.env.GITHUB_TOKEN = 'test-token';
});

test('api: success returns data, sorted years, and sends the token only as a header to GitHub', async () => {
  let seen: RequestInit | undefined;
  const f = (async (_u: unknown, init?: RequestInit) => ((seen = init), new Response(JSON.stringify(ok)))) as unknown as typeof fetch;
  const r = await getContributions(null, f, now);
  assert.equal(r.data?.total, 2);
  assert.deepEqual(r.data?.years, [2025, 2024, 2023]);
  assert.equal((seen?.headers as Record<string, string>).Authorization, 'Bearer test-token');
  assert.equal(JSON.stringify(r).includes('test-token'), false);
});

test('api: missing token reports not_configured', async () => {
  delete process.env.GITHUB_TOKEN;
  assert.deepEqual(await getContributions(null, reply(ok), now), { error: 'not_configured' });
});

test('api: errors fall back to cached data, or report an error code when there is none', async () => {
  const first = await getContributions(2025, reply(ok), now);
  assert.equal(first.stale, undefined);
  const down = (async () => { throw new Error('network'); }) as unknown as typeof fetch;
  const fallback = await getContributions(2025, down, now);
  assert.equal(fallback.stale, true);
  assert.equal(fallback.data?.total, 2);
  assert.equal(fallback.error, 'unavailable');
  assert.deepEqual(await getContributions(2024, down, now), { error: 'unavailable' });
});

test('api: rate limits are detected, remembered and not retried until they lift', async () => {
  let calls = 0;
  const limited = (async () => (calls++, new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 600) } }))) as unknown as typeof fetch;
  assert.deepEqual(await getContributions(null, limited, now), { error: 'rate_limited' });
  assert.deepEqual(await getContributions(null, limited, now), { error: 'rate_limited' });
  assert.equal(calls, 1);
});

test('api: unknown user, GraphQL rate-limit errors and bad payloads', async () => {
  assert.deepEqual(await getContributions(null, reply({ data: { user: null } }), now), { error: 'not_found' });
  assert.deepEqual(await getContributions(null, reply({ data: { user: { contributionsCollection: { contributionCalendar: { totalContributions: 'x' } } } } }), now), { error: 'unavailable' });
  assert.deepEqual(await getContributions(null, reply({ errors: [{ type: 'RATE_LIMITED' }] }), now), { error: 'rate_limited' });
});

test('api: an empty calendar is valid data, not an error', async () => {
  const empty = { data: { user: { contributionsCollection: { contributionYears: [2025], contributionCalendar: { totalContributions: 0, weeks: [] } } } } };
  const r = await getContributions(null, reply(empty), now);
  assert.equal(r.data?.total, 0);
  assert.deepEqual(r.data?.weeks, []);
});
