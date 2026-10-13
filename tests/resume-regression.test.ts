// Regression tests for the "Something went wrong. Please try again in a moment." report on the résumé form:
//  1. POST /api/resume/request returned 503 because the ResumeAccess table was missing (Prisma P2021): the migrations had
//     not been applied to the database in use. The server must say so (secret-free) and the visitor must get a specific message.
//  2. Companies House answered 401 on every keystroke: after a rejected key, live calls pause instead of failing each time.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { requestFailureMessage } from '../src/lib/resume-access';
import { credentialsRejected, getCompanyProfile, resetCompaniesHouseCaches, searchCompaniesLive } from '../src/lib/companies-house.server';

const realFetch = globalThis.fetch;
const realError = console.error;
const realWarn = console.warn;

describe('visitor-facing messages', () => {
  test('each failure has its own honest message; only unexpected statuses are generic', () => {
    assert.match(requestFailureMessage(503), /temporarily unavailable.*Nothing was sent/);
    assert.match(requestFailureMessage(0), /could not reach the server/);
    assert.match(requestFailureMessage(429), /Too many requests/);
    assert.match(requestFailureMessage(502), /could not send the verification email/);
    assert.match(requestFailureMessage(418), /Something went wrong/);
    assert.ok(![503, 0, 429, 502].some((s) => /Something went wrong/.test(requestFailureMessage(s))));
  });
});

describe('Companies House rejects the API key (401)', () => {
  let calls = 0;
  let logged: string[] = [];
  beforeEach(() => {
    calls = 0; logged = [];
    resetCompaniesHouseCaches();
    process.env.COMPANIES_HOUSE_API_KEY = 'secret-key-value';
    globalThis.fetch = (async () => { calls++; return new Response('{"error":"invalid-authorization"}', { status: 401 }); }) as typeof fetch;
    console.error = (...a: unknown[]) => { logged.push(a.join(' ')); };
    console.warn = (...a: unknown[]) => { logged.push(a.join(' ')); };
  });
  afterEach(() => { globalThis.fetch = realFetch; console.error = realError; console.warn = realWarn; delete process.env.COMPANIES_HOUSE_API_KEY; resetCompaniesHouseCaches(); });

  test('live search and profile lookups pause after one 401 instead of calling Companies House on every keystroke', async () => {
    assert.equal(await searchCompaniesLive('tesco', 'tesco'), 'unavailable');
    assert.equal(credentialsRejected(), true);
    for (const q of ['tesco p', 'tesco pl', 'tesco plc']) assert.equal(await searchCompaniesLive(q, q), 'unavailable');
    assert.equal(await getCompanyProfile('00445790'), 'unavailable');
    assert.equal(calls, 1, 'only the first call reached Companies House');
  });

  test('the server log names the setting to fix, once, and never contains the key', async () => {
    await searchCompaniesLive('a1', 'a1');
    await searchCompaniesLive('b2', 'b2');
    await getCompanyProfile('00445790');
    const lines = logged.filter((l) => l.includes('[companies-house]'));
    assert.equal(lines.length, 1);
    assert.match(lines[0], /API key rejected \(401\).*COMPANIES_HOUSE_API_KEY/);
    assert.ok(!logged.join('\n').includes('secret-key-value'));
  });

  test('a 429 or 500 is a temporary failure, not a rejected key', async () => {
    globalThis.fetch = (async () => { calls++; return new Response('', { status: 429 }); }) as typeof fetch;
    await searchCompaniesLive('tesco', 'tesco');
    assert.equal(credentialsRejected(), false);
  });
});

const TEST_DB = process.env.TEST_DATABASE_URL;
describe('migrations not applied to the database in use', { skip: TEST_DB ? false : 'TEST_DATABASE_URL is not set' }, () => {
  const run = promisify(execFile);
  // A schema with no tables reproduces the original failure exactly: Prisma P2021 (table does not exist).
  const script = `
    (async () => {
      const { POST } = await import('./src/app/api/resume/request/route');
      const res = await POST(new Request('https://www.dominicwokorach.me/api/resume/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://www.dominicwokorach.me', host: 'www.dominicwokorach.me', 'x-real-ip': '203.0.113.9' },
        body: JSON.stringify({ fullName: 'Repro Test', email: 'repro@example.test', company: 'Acme Ltd' }),
      }));
      console.log('RESULT', res.status, JSON.stringify(await res.json()));
      process.exit(0);
    })();`;

  test('the request fails closed with 503, nothing is reported as sent, and the log says how to fix it', async () => {
    const { stdout, stderr } = await run('npx', ['tsx', '--eval', script], {
      env: { ...process.env, DATABASE_URL: TEST_DB!, DATABASE_SCHEMA: 'no_migrations_applied_here', TRUST_PROXY_HEADERS: 'true', DOTENV_CONFIG_PATH: '/dev/null' },
    });
    assert.match(stdout, /RESULT 503 {"error":"unavailable"}/);
    assert.match(stderr, /P2021/);
    assert.match(stderr, /db:deploy/);
    assert.ok(!/postgres:\/\//.test(stderr), 'no connection string in the log');
  });
});
