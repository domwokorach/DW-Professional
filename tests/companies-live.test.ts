// Companies House live search and result merging: pure logic with a stubbed fetch (no network, no database).
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { normaliseCompanyNumber, type CompanySummary } from '../src/lib/companies';
import {
  getCompanyProfile, resetCompaniesHouseCaches, searchCompaniesLive, takeUpstreamSlot, toLiveHits,
} from '../src/lib/companies-house.server';
import { mergeResults, searchCompaniesCombined } from '../src/lib/company-search.server';

const realFetch = globalThis.fetch;
type Call = { url: string; auth: string | null };
let calls: Call[] = [];
const stub = (handler: (url: string) => Response | Promise<Response>) => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({ url: String(input), auth: headers.get('authorization') });
    return handler(String(input));
  }) as typeof fetch;
};
const ok = (body: unknown) => Response.json(body, { status: 200 });

const KEY = 'test-key-not-real';
beforeEach(() => {
  calls = [];
  resetCompaniesHouseCaches();
  process.env.COMPANIES_HOUSE_API_KEY = KEY;
  delete process.env.COMPANY_DATABASE_URL;
});
afterEach(() => { globalThis.fetch = realFetch; delete process.env.COMPANIES_HOUSE_API_KEY; });

const tesco = { company_number: '00445790', title: 'TESCO PLC', company_status: 'active', company_type: 'plc', address_snippet: 'Tesco House, Shire Park, Welwyn Garden City, AL7 1GA', address: { locality: 'Welwyn Garden City', postal_code: 'al7 1ga' } };

describe('live search mapping', () => {
  test('maps hits and keeps company numbers as text with leading zeros', () => {
    const [hit] = toLiveHits({ items: [tesco] });
    assert.deepEqual([hit.companyNumber, hit.companyName, hit.status, hit.locality, hit.postcode], ['00445790', 'TESCO PLC', 'active', 'Welwyn Garden City', 'AL7 1GA']);
    assert.equal(toLiveHits({ items: [{ title: 'No number' }, { company_number: 'sc095000', title: 'ACME (SCOTLAND) LTD' }, {}] }).map((h) => h.companyNumber).join(), 'SC095000');
    assert.deepEqual(toLiveHits({}), []);
  });

  test('registration numbers are padded and upper-cased (leading zeros survive)', () => {
    assert.equal(normaliseCompanyNumber('445790'), '00445790');
    assert.equal(normaliseCompanyNumber('sc95000'), 'SC095000');
    assert.equal(normaliseCompanyNumber(' 00445790 '), '00445790');
    assert.equal(normaliseCompanyNumber('not a number!'), null);
  });
});

describe('searchCompaniesLive', () => {
  test('calls only the official search endpoint with Basic auth and a bounded page size', async () => {
    stub(() => ok({ items: [tesco] }));
    const res = await searchCompaniesLive('tesco', 'tesco', 10);
    assert.ok(res !== 'unavailable' && res.hits.length === 1);
    assert.equal(calls.length, 1);
    const url = new URL(calls[0].url);
    assert.equal(url.origin + url.pathname, 'https://api.company-information.service.gov.uk/search/companies');
    assert.equal(url.searchParams.get('q'), 'tesco');
    assert.equal(url.searchParams.get('items_per_page'), '10');
    assert.equal(calls[0].auth, `Basic ${Buffer.from(`${KEY}:`).toString('base64')}`);
  });

  test('answers are cached and identical concurrent searches share one upstream call', async () => {
    stub(async () => { await new Promise((r) => setTimeout(r, 20)); return ok({ items: [tesco] }); });
    await Promise.all([searchCompaniesLive('tesco', 'tesco'), searchCompaniesLive('tesco', 'tesco'), searchCompaniesLive('tesco', 'tesco')]);
    await searchCompaniesLive('tesco', 'tesco');
    assert.equal(calls.length, 1);
  });

  test('missing credentials, rate limit, server error and timeout all degrade to "unavailable" without throwing', async () => {
    delete process.env.COMPANIES_HOUSE_API_KEY;
    stub(() => ok({ items: [] }));
    assert.equal(await searchCompaniesLive('tesco', 'tesco'), 'unavailable');
    assert.equal(calls.length, 0, 'no request without a key');

    process.env.COMPANIES_HOUSE_API_KEY = KEY;
    for (const status of [429, 500, 401]) {
      resetCompaniesHouseCaches();
      stub(() => new Response('{"error":"x"}', { status }));
      assert.equal(await searchCompaniesLive('tesco', 'tesco'), 'unavailable', `status ${status}`);
    }
    resetCompaniesHouseCaches();
    stub(() => { throw Object.assign(new Error('timeout'), { name: 'TimeoutError' }); });
    assert.equal(await searchCompaniesLive('tesco', 'tesco'), 'unavailable');
  });

  test('the upstream budget stops calls before Companies House would rate limit this key', async () => {
    let granted = 0;
    for (let i = 0; i < 1000; i++) if (takeUpstreamSlot(1_000_000)) granted++;
    assert.equal(granted, 400);
    assert.equal(takeUpstreamSlot(1_000_000 + 5 * 60 * 1000 + 1), true, 'the window frees up after five minutes');
    stub(() => ok({ items: [tesco] }));
    resetCompaniesHouseCaches();
    for (let i = 0; i < 400; i++) takeUpstreamSlot();
    assert.equal(await searchCompaniesLive('tesco', 'tesco'), 'unavailable');
    assert.equal(calls.length, 0);
  });

  test('profile lookup keeps leading zeros and reports not_found', async () => {
    stub((url) => url.endsWith('/company/00445790')
      ? ok({ company_number: '00445790', company_name: 'TESCO PLC', company_status: 'active', type: 'plc', registered_office_address: { address_line_1: 'Shire Park', locality: 'Welwyn Garden City', postal_code: 'AL7 1GA' } })
      : new Response('', { status: 404 }));
    const found = await getCompanyProfile('00445790');
    assert.ok(typeof found === 'object' && found.profile.companyNumber === '00445790' && found.profile.postTown === 'Welwyn Garden City');
    assert.equal(await getCompanyProfile('00000001'), 'not_found');
  });
});

describe('mergeResults', () => {
  const c = (companyNumber: string, companyName: string, companyStatus: string | null, source: 'live' | 'cached'): CompanySummary =>
    ({ companyNumber, companyName, companyStatus, companyType: null, address: null, locality: null, source });

  test('a company in both sources appears once, with the live details', () => {
    const merged = mergeResults(
      [c('00445790', 'TESCO PLC', 'Active', 'live')],
      [c('00445790', 'TESCO PLC (OLD NAME)', 'Active', 'cached'), c('00519500', 'TESCO STORES LIMITED', 'Active', 'cached')],
      'tesco',
    );
    assert.equal(merged.length, 2);
    assert.equal(merged.find((m) => m.companyNumber === '00445790')!.source, 'live');
  });

  test('exact and strong matches come first; similar names are all kept; active before dissolved', () => {
    const merged = mergeResults(
      [c('03', 'ACME TRADING SERVICES LIMITED', 'Active', 'live'), c('02', 'ACME TRADING LIMITED', 'Dissolved', 'live'), c('01', 'THE ACME TRADING COMPANY', 'Active', 'live')],
      [c('04', 'ACME TRADING LIMITED', 'Active', 'cached'), c('05', 'ACME', 'Active', 'cached')],
      'acme trading limited',
    );
    assert.deepEqual(merged.map((m) => m.companyNumber), ['04', '02', '03', '01', '05'].filter((n) => merged.some((m) => m.companyNumber === n)));
    assert.equal(merged[0].companyName, 'ACME TRADING LIMITED');
    assert.equal(merged[0].companyStatus, 'Active', 'the active exact match beats the dissolved one');
    assert.equal(merged.filter((m) => m.companyName === 'ACME TRADING LIMITED').length, 2, 'two distinct companies with the same name stay separate');
  });

  test('a registration number puts that company first and at most ten are returned', () => {
    const many = Array.from({ length: 15 }, (_, i) => c(String(i).padStart(8, '0'), `ALPHA ${i} LIMITED`, 'Active', 'cached'));
    const merged = mergeResults([], [...many, c('00445790', 'TESCO PLC', 'Active', 'cached')], '445790');
    assert.equal(merged[0].companyNumber, '00445790');
    assert.equal(merged.length, 10);
  });
});

describe('searchCompaniesCombined without a database', () => {
  test('live results are labelled live and the answer says live search was available', async () => {
    stub(() => ok({ items: [tesco] }));
    const r = await searchCompaniesCombined('tesco');
    assert.equal(r.answered && r.liveAvailable, true);
    assert.equal(r.companies[0].source, 'live');
    assert.equal(r.companies[0].companyNumber, '00445790');
  });

  test('a registration number is looked up as a profile, not searched', async () => {
    stub((url) => url.includes('/company/00445790') ? ok({ company_number: '00445790', company_name: 'TESCO PLC', company_status: 'active', type: 'plc', registered_office_address: { locality: 'Welwyn Garden City' } }) : new Response('', { status: 404 }));
    const r = await searchCompaniesCombined('445790');
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith('/company/00445790'));
    assert.deepEqual(r.companies.map((x) => x.companyNumber), ['00445790']);
    stub(() => new Response('', { status: 404 }));
    resetCompaniesHouseCaches();
    assert.deepEqual((await searchCompaniesCombined('00000001')).companies, []);
  });

  test('nothing configured, or live search failing with no database, is reported as not answered', async () => {
    delete process.env.COMPANIES_HOUSE_API_KEY;
    assert.equal((await searchCompaniesCombined('tesco')).answered, false);
    process.env.COMPANIES_HOUSE_API_KEY = KEY;
    stub(() => new Response('', { status: 503 }));
    const r = await searchCompaniesCombined('tesco');
    assert.deepEqual([r.answered, r.liveAvailable, r.companies.length], [false, false, 0]);
  });

  test('the API key never appears in any result', async () => {
    stub(() => ok({ items: [tesco] }));
    assert.ok(!JSON.stringify(await searchCompaniesCombined('tesco')).includes(KEY));
  });
});
