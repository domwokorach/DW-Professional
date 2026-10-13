// The résumé request stores the company the visitor picked, re-checked on the server by its registration number.
// Needs a throwaway database with both migration sets applied: TEST_DATABASE_URL=postgres://… (see tests/resume-flow.test.ts).
import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, test } from 'node:test';

const URL_ = process.env.TEST_DATABASE_URL;
const skip = URL_ ? false : 'TEST_DATABASE_URL is not set';
if (URL_) {
  process.env.DATABASE_URL = URL_;
  delete process.env.PORTFOLIO_DATABASE_URL;
  process.env.COMPANY_DATABASE_URL = URL_;
  process.env.TRUST_PROXY_HEADERS = 'true';
}

const ORIGIN = 'https://www.dominicwokorach.me';
const realFetch = globalThis.fetch;
const profile = (over: Record<string, unknown> = {}) => Response.json({
  company_number: '00445790', company_name: 'TESCO PLC', company_status: 'active', type: 'plc',
  registered_office_address: { address_line_1: 'Tesco House, Shire Park', locality: 'Welwyn Garden City', postal_code: 'AL7 1GA' }, ...over,
});

describe('résumé request stores the verified company', { skip }, () => {
  let request: typeof import('../src/app/api/resume/request/route');
  let prisma: NonNullable<ReturnType<typeof import('../src/lib/prisma.server')['getPrisma']>>;
  let companies: NonNullable<ReturnType<typeof import('../src/lib/company-db.server')['getCompanyPrisma']>>;
  let store: typeof import('../src/lib/resume-store.server');
  let ch: typeof import('../src/lib/companies-house.server');
  let setMailer: typeof import('../src/lib/resume-email.server')['useResumeMailer'];
  let sent = 0;
  let n = 0;

  before(async () => {
    request = await import('../src/app/api/resume/request/route');
    store = await import('../src/lib/resume-store.server');
    ch = await import('../src/lib/companies-house.server');
    setMailer = (await import('../src/lib/resume-email.server')).useResumeMailer;
    prisma = (await import('../src/lib/prisma.server')).getPrisma()!;
    companies = (await import('../src/lib/company-db.server')).getCompanyPrisma()!;
    setMailer(async () => { sent++; return true; });
  });
  after(async () => { setMailer(null); await prisma?.$disconnect(); await companies?.$disconnect(); });
  beforeEach(async () => {
    sent = 0;
    ch.resetCompaniesHouseCaches();
    process.env.COMPANIES_HOUSE_API_KEY = 'k';
    await prisma.resumeAccess.deleteMany();
    await companies.company.deleteMany();
  });
  afterEach(() => { globalThis.fetch = realFetch; delete process.env.COMPANIES_HOUSE_API_KEY; });

  const post = async (body: Record<string, unknown>) => {
    const res = await request.POST(new Request(`${ORIGIN}/api/resume/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, host: 'www.dominicwokorach.me', 'x-real-ip': `203.0.113.${(n++ % 250) + 1}` },
      body: JSON.stringify({ fullName: 'Jane Smith', email: `jane${n}@acme.test`, company: 'whatever the browser typed', ...body }),
    }));
    return { res, row: await prisma.resumeAccess.findFirst({ orderBy: { createdAt: 'desc' } }) };
  };

  test('a company confirmed live is stored with the official name, number, status, location, source and check time', async () => {
    globalThis.fetch = (async () => profile()) as typeof fetch;
    const before = Date.now();
    const { res, row } = await post({ company: 'tesco', companyNumber: '445790' });
    assert.equal(res.status, 200);
    assert.equal(row!.company, 'TESCO PLC', 'the official name replaces what the browser sent');
    assert.equal(row!.companyNumber, '00445790', 'leading zeros preserved');
    assert.equal(row!.companyStatus, 'Active');
    assert.match(row!.companyLocation!, /Welwyn Garden City/);
    assert.equal(row!.companySource, 'companies_house');
    assert.ok(row!.companyVerifiedAt && row!.companyVerifiedAt.getTime() >= before - 1000);
    assert.equal(sent, 1, 'the email verification still goes out');
    const admin = (await store.listResumeForAdmin()).rows[0];
    assert.deepEqual([admin.company, admin.companyNumber, admin.companySource], ['TESCO PLC', '00445790', 'companies_house']);
  });

  test('when Companies House is unavailable the saved record is used and labelled as not checked live', async () => {
    await companies.company.create({ data: { companyNumber: '00445790', companyName: 'TESCO PLC', nameSearch: 'tesco plc', status: 'Active', postTown: 'WELWYN GARDEN CITY', postcode: 'AL7 1GA' } });
    globalThis.fetch = (async () => new Response('', { status: 503 })) as typeof fetch;
    const { row } = await post({ companyNumber: '00445790' });
    assert.equal(row!.companySource, 'company_database');
    assert.equal(row!.companyVerifiedAt, null, 'never labelled verified');
    assert.equal(row!.company, 'TESCO PLC');
  });

  test('a made-up or unknown number is dropped: the typed name is kept as a manual entry', async () => {
    globalThis.fetch = (async () => new Response('', { status: 404 })) as typeof fetch;
    const { res, row } = await post({ company: 'Globex GmbH', companyNumber: '99999999' });
    assert.equal(res.status, 200);
    assert.deepEqual([row!.company, row!.companyNumber, row!.companySource, row!.companyVerifiedAt], ['Globex GmbH', null, 'manual', null]);
    const junk = await post({ company: 'Initech', companyNumber: "1'; DROP TABLE x;--" });
    assert.deepEqual([junk.row!.company, junk.row!.companyNumber, junk.row!.companySource], ['Initech', null, 'manual']);
  });

  test('a name typed by hand (non-UK organisation) is accepted without any lookup', async () => {
    let calls = 0;
    globalThis.fetch = (async () => { calls++; return profile(); }) as typeof fetch;
    const { res, row } = await post({ company: '  Siemens   AG ' });
    assert.equal(res.status, 200);
    assert.deepEqual([row!.company, row!.companyNumber, row!.companySource], ['Siemens AG', null, 'manual']);
    assert.equal(calls, 0);
  });

  test('the company is still required, and a missing Companies House key does not block the request', async () => {
    assert.equal((await post({ company: '   ' })).res.status, 422);
    delete process.env.COMPANIES_HOUSE_API_KEY;
    const { res, row } = await post({ company: 'Acme Ltd', companyNumber: '00445790' });
    assert.equal(res.status, 200);
    assert.equal(row!.companySource === 'manual' || row!.companySource === 'company_database', true);
    assert.equal(row!.companyVerifiedAt, null);
  });
});
