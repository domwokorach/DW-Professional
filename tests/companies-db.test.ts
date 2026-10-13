// Company search against a real Postgres: CSV import through the existing importer, indexed search, cached records,
// live + saved merging, and the HTTP routes. Needs a throwaway database: TEST_DATABASE_URL=postgres://… with the company
// migrations applied (npm run companies:migrate). Skipped otherwise. Never point it at production: it deletes all rows.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { after, afterEach, before, beforeEach, describe, test } from 'node:test';

const URL_ = process.env.TEST_DATABASE_URL;
const skip = URL_ ? false : 'TEST_DATABASE_URL is not set';
if (URL_) {
  process.env.COMPANY_DATABASE_URL = URL_;
  process.env.COMPANY_DATABASE_SCHEMA = 'companies';
}

const CSV = [
  'CompanyName, CompanyNumber,CompanyStatus,CompanyCategory,IncorporationDate,RegAddress.AddressLine1,RegAddress.PostTown,RegAddress.PostCode',
  '"TESCO PLC",00445790,Active,Public Limited Company,27/11/1947,"TESCO HOUSE",WELWYN GARDEN CITY,AL7 1GA',
  '"TESCO STORES LIMITED",00519500,Active,Private Limited Company,01/01/1947,"TESCO HOUSE",WELWYN GARDEN CITY,AL7 1GA',
  '"ACME TRADING LIMITED",01000001,Active,Private Limited Company,01/01/1990,"1 HIGH STREET",LEEDS,LS1 1AA',
  '"ACME TRADING LIMITED",01000002,Dissolved,Private Limited Company,01/01/1980,"2 LOW ROAD",YORK,YO1 1AA',
  '"ACME TRADING SERVICES LTD",01000003,Active,Private Limited Company,01/01/2001,"3 MILL LANE",BRISTOL,BS1 1AA',
  '"MARKS & SPENCER GROUP PLC",04256886,Active,Public Limited Company,01/01/2001,"WATERSIDE HOUSE",LONDON,W2 1NW',
  '"HIGHLANDS (SCOTLAND) LTD",SC095000,Active,Private Limited Company,01/01/1985,"5 PRINCES STREET",EDINBURGH,EH2 2AA',
].join('\n');

const run = promisify(execFile);
const realFetch = globalThis.fetch;
const ok = (body: unknown) => Response.json(body, { status: 200 });
const stub = (h: (url: string) => Response) => { globalThis.fetch = (async (i: RequestInfo | URL) => h(String(i))) as typeof fetch; };

describe('company search with PostgreSQL', { skip }, () => {
  let db: typeof import('../src/lib/company-db.server');
  let search: typeof import('../src/lib/company-search.server');
  let lookup: typeof import('../src/lib/company-lookup.server');
  let ch: typeof import('../src/lib/companies-house.server');
  let route: typeof import('../src/app/api/companies/search/route');
  let verify: typeof import('../src/app/api/companies/verify/route');
  let file = '';
  const importer = (path: string) => run('npx', ['tsx', 'scripts/import-companies.ts', '--file', path], {
    env: { ...process.env, COMPANY_DATABASE_URL: URL_!, DOTENV_CONFIG_PATH: '/dev/null', AWS_S3_BUCKET: '', AWS_S3_KEY: '', COMPANIES_S3_URI: '' },
  });

  before(async () => {
    db = await import('../src/lib/company-db.server');
    search = await import('../src/lib/company-search.server');
    lookup = await import('../src/lib/company-lookup.server');
    ch = await import('../src/lib/companies-house.server');
    route = await import('../src/app/api/companies/search/route');
    verify = await import('../src/app/api/companies/verify/route');
    file = join(mkdtempSync(join(tmpdir(), 'companies-')), 'basic.csv');
    writeFileSync(file, CSV);
  });
  after(async () => { await db.getCompanyPrisma()?.$disconnect(); });
  beforeEach(async () => {
    await db.getCompanyPrisma()!.company.deleteMany();
    ch.resetCompaniesHouseCaches();
    delete process.env.COMPANIES_HOUSE_API_KEY;
  });
  afterEach(() => { globalThis.fetch = realFetch; });

  const imported = async () => { const out = await importer(file); assert.match(out.stdout, /upserted|Imported|imported/i); };
  const get = (q: string) => route.GET(new Request(`https://www.dominicwokorach.me/api/companies/search?q=${encodeURIComponent(q)}`, { headers: { 'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 250)}` } }));

  test('the existing importer loads the CSV (from a file standing in for S3), keeping leading zeros', async () => {
    await imported();
    const prisma = db.getCompanyPrisma()!;
    assert.equal(await prisma.company.count(), 7);
    assert.equal((await prisma.company.findUniqueOrThrow({ where: { companyNumber: '00445790' } })).companyName, 'TESCO PLC');
    await imported(); // safe to re-run
    assert.equal(await prisma.company.count(), 7, 're-import never duplicates');
  });

  test('search by name: strong matches first, cached label, similar names all present', async () => {
    await imported();
    const r = await search.searchCompaniesCombined('acme trading');
    assert.equal(r.liveAvailable, false);
    assert.ok(r.answered);
    assert.equal(r.companies[0].companyNumber, '01000001', 'the active exact name match is first');
    const names = r.companies.map((c) => `${c.companyName}|${c.companyStatus}`);
    assert.ok(names.includes('ACME TRADING LIMITED|Active') && names.includes('ACME TRADING LIMITED|Dissolved') && names.some((n) => n.startsWith('ACME TRADING SERVICES')));
    assert.ok(r.companies.every((c) => c.source === 'cached'));
    assert.equal(r.companies[0].companyStatus, 'Active', 'active before dissolved among equal names');
    assert.equal((await search.searchCompaniesCombined('marks & spencer')).companies[0].companyNumber, '04256886');
    assert.equal((await search.searchCompaniesCombined('tesko')).companies[0].companyNumber, '00445790', 'typo tolerance');
  });

  test('search by registration number, with or without leading zeros and with prefixes', async () => {
    await imported();
    for (const q of ['00445790', '445790', ' 445790 ']) assert.equal((await search.searchCompaniesCombined(q.trim())).companies[0].companyNumber, '00445790');
    assert.equal((await search.searchCompaniesCombined('sc95000')).companies[0].companyNumber, 'SC095000');
  });

  test('live results are merged with saved records and the live copy wins', async () => {
    await imported();
    process.env.COMPANIES_HOUSE_API_KEY = 'k';
    stub(() => ok({ items: [{ company_number: '00445790', title: 'TESCO PLC', company_status: 'active', company_type: 'plc', address_snippet: 'Tesco House, Welwyn Garden City', address: { locality: 'Welwyn Garden City' } }, { company_number: '09999999', title: 'TESCO NEW VENTURES LIMITED', company_status: 'active', address: { locality: 'London' } }] }));
    const r = await search.searchCompaniesCombined('tesco');
    assert.equal(r.liveAvailable, true);
    const bySource = Object.fromEntries(r.companies.map((c) => [c.companyNumber, c.source]));
    assert.equal(bySource['00445790'], 'live');
    assert.equal(bySource['09999999'], 'live');
    assert.equal(bySource['00519500'], 'cached');
    assert.equal(new Set(r.companies.map((c) => c.companyNumber)).size, r.companies.length, 'no duplicates');
  });

  test('when Companies House is down the saved records answer, honestly labelled', async () => {
    await imported();
    process.env.COMPANIES_HOUSE_API_KEY = 'k';
    stub(() => new Response('', { status: 503 }));
    const r = await search.searchCompaniesCombined('tesco');
    assert.deepEqual([r.answered, r.liveAvailable], [true, false]);
    assert.ok(r.companies.length >= 2 && r.companies.every((c) => c.source === 'cached'));
  });

  test('selecting a company: live profile is saved as verified and a later CSV import cannot overwrite it', async () => {
    await imported();
    process.env.COMPANIES_HOUSE_API_KEY = 'k';
    stub((url) => url.endsWith('/company/00445790')
      ? ok({ company_number: '00445790', company_name: 'TESCO PLC (RENAMED LIVE)', company_status: 'active', type: 'plc', registered_office_address: { address_line_1: 'Shire Park', locality: 'Welwyn Garden City', postal_code: 'AL7 1GA' } })
      : new Response('', { status: 404 }));
    const found = await lookup.lookupCompany('00445790');
    assert.ok(found && found !== 'not_found');
    assert.equal(found.verified, true);
    assert.ok(found.verifiedAt);
    assert.equal(found.company.companyName, 'TESCO PLC (RENAMED LIVE)');
    await new Promise((r) => setTimeout(r, 200)); // the cache write is best effort and not awaited
    const prisma = db.getCompanyPrisma()!;
    const row = await prisma.company.findUniqueOrThrow({ where: { companyNumber: '00445790' } });
    assert.equal(row.companyName, 'TESCO PLC (RENAMED LIVE)');
    assert.ok(row.verifiedAt);
    await imported(); // the older CSV says "TESCO PLC"
    assert.equal((await prisma.company.findUniqueOrThrow({ where: { companyNumber: '00445790' } })).companyName, 'TESCO PLC (RENAMED LIVE)', 'verified data is newer than the CSV');
    assert.equal((await prisma.company.findUniqueOrThrow({ where: { companyNumber: '00519500' } })).verifiedAt, null);
  });

  test('a company missing from the dataset is cached once Companies House has verified it', async () => {
    process.env.COMPANIES_HOUSE_API_KEY = 'k';
    stub(() => ok({ company_number: '12345678', company_name: 'FRESH START LTD', company_status: 'active', type: 'ltd', registered_office_address: { locality: 'Cardiff' } }));
    assert.ok((await lookup.lookupCompany('12345678')) !== 'not_found');
    await new Promise((r) => setTimeout(r, 200));
    delete process.env.COMPANIES_HOUSE_API_KEY;
    const r = await search.searchCompaniesCombined('fresh start');
    assert.equal(r.companies[0]?.companyNumber, '12345678');
    assert.equal(r.companies[0]?.source, 'cached');
  });

  test('verify falls back to the saved record when Companies House is unavailable', async () => {
    await imported();
    process.env.COMPANIES_HOUSE_API_KEY = 'k';
    stub(() => new Response('', { status: 429 }));
    const found = await lookup.lookupCompany('00445790');
    assert.ok(found && found !== 'not_found');
    assert.equal(found.verified, false);
    assert.equal(found.company.companyName, 'TESCO PLC');
    // Not in the dataset and Companies House cannot say: unavailable, never a false "not found".
    assert.equal(await lookup.lookupCompany('00000001'), null);
    ch.resetCompaniesHouseCaches();
    stub(() => new Response('', { status: 404 }));
    assert.equal(await lookup.lookupCompany('00000001'), 'not_found');
  });

  test('search route: validation, results with source labels, and 503 when no source can answer', async () => {
    await imported();
    assert.equal((await get('a')).status, 400);
    assert.equal((await get('x'.repeat(61))).status, 400);
    assert.equal((await get('bad;char')).status, 400);
    const res = await get('tesco');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.liveAvailable, false);
    assert.ok(body.companies.length <= 10 && body.companies[0].source === 'cached');
    assert.ok(!JSON.stringify(body).match(/postgres|password|COMPANIES_HOUSE/i));

    // Database cannot be reached and Companies House is down: report unavailable, never a stack trace.
    const saved = process.env.COMPANY_DATABASE_URL;
    const g = globalThis as unknown as { companyPrisma?: unknown };
    const pool = g.companyPrisma; g.companyPrisma = undefined;
    process.env.COMPANY_DATABASE_URL = 'postgres://nobody@127.0.0.1:1/none';
    process.env.COMPANIES_HOUSE_API_KEY = 'k';
    stub(() => new Response('', { status: 500 }));
    const down = await get('tesco');
    assert.equal(down.status, 503);
    assert.deepEqual(await down.json(), { error: 'unavailable' });
    process.env.COMPANY_DATABASE_URL = saved; g.companyPrisma = pool;

    // With a database failure but live search working, live results still come back.
    g.companyPrisma = undefined;
    process.env.COMPANY_DATABASE_URL = 'postgres://nobody@127.0.0.1:1/none';
    stub(() => ok({ items: [{ company_number: '00445790', title: 'TESCO PLC', company_status: 'active' }] }));
    ch.resetCompaniesHouseCaches();
    const liveOnly = await (await get('tesco')).json();
    assert.equal(liveOnly.companies[0].source, 'live');
    process.env.COMPANY_DATABASE_URL = saved; g.companyPrisma = pool;
  });

  test('search route is rate limited per client and does nothing when nothing is configured', async () => {
    await imported();
    const same = () => route.GET(new Request('https://www.dominicwokorach.me/api/companies/search?q=tesco', { headers: { 'x-forwarded-for': '203.0.113.200' } }));
    let limited = 0;
    for (let i = 0; i < 70; i++) if ((await same()).status === 429) limited++;
    assert.ok(limited >= 9, `expected rate limiting, saw ${limited}`);
    const saved = process.env.COMPANY_DATABASE_URL;
    delete process.env.COMPANY_DATABASE_URL;
    assert.equal((await get('tesco')).status, 404, 'feature off: the field stays a plain input');
    process.env.COMPANY_DATABASE_URL = saved;
  });

  test('verify route normalises numbers and rejects junk', async () => {
    await imported();
    const call = (n: string) => verify.GET(new Request(`https://www.dominicwokorach.me/api/companies/verify?number=${encodeURIComponent(n)}`, { headers: { 'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 250)}` } }));
    assert.equal((await call('!!')).status, 400);
    const res = await call('445790');
    assert.equal(res.status, 200);
    assert.equal((await res.json()).company.companyNumber, '00445790');
  });
});
