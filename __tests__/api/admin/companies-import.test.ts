import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/admin/companies/import/route';
import { db } from '@/lib/database/db';
import { replaceCompanyRecords } from '@/lib/companies/search';
import { buildUser, buildSession } from '../../../test/factories';
import { authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';

jest.mock('@/lib/database/db');
jest.mock('@/lib/companies/search', () => {
  const actual = jest.requireActual('@/lib/companies/search');
  return { ...actual, replaceCompanyRecords: jest.fn() };
});

const ORIGIN = 'http://localhost:3000';

function csvFile(content: string, name = 'companies.csv', type = 'text/csv') {
  return new File([content], name, { type });
}

async function authedFormRequest(form: FormData) {
  const user = buildUser();
  const session = buildSession({ userId: user.id });
  const cookies = await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

  (db.user.findUnique as jest.Mock).mockResolvedValue(user);
  (db.session.findUnique as jest.Mock).mockResolvedValue(session);

  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');

  const request = new NextRequest(`${ORIGIN}/api/admin/companies/import`, {
    method: 'POST',
    headers: { cookie: cookieHeader, origin: ORIGIN, host: 'localhost:3000' },
    body: form,
  });
  return { request, user };
}

describe('POST /api/admin/companies/import', () => {
  afterEach(() => {
    clearMockAuthCookies();
    jest.clearAllMocks();
  });

  it('returns 401 when there is no session', async () => {
    const form = new FormData();
    form.set('file', csvFile('company_name\nAcme Ltd'));
    const request = new NextRequest(`${ORIGIN}/api/admin/companies/import`, {
      method: 'POST',
      headers: { origin: ORIGIN, host: 'localhost:3000' },
      body: form,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('rejects a cross-site request with 403', async () => {
    const form = new FormData();
    form.set('file', csvFile('company_name\nAcme Ltd'));
    const request = new NextRequest(`${ORIGIN}/api/admin/companies/import`, {
      method: 'POST',
      headers: { origin: 'https://evil.example.com', host: 'localhost:3000' },
      body: form,
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('rejects a non-CSV file', async () => {
    const form = new FormData();
    form.set('file', csvFile('not a csv', 'companies.txt', 'text/plain'));
    const { request } = await authedFormRequest(form);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_file_type');
    expect(replaceCompanyRecords).not.toHaveBeenCalled();
  });

  it('rejects a file over the size limit', async () => {
    const form = new FormData();
    const oversized = 'x'.repeat(16 * 1024 * 1024);
    form.set('file', csvFile(oversized));
    const { request } = await authedFormRequest(form);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('file_too_large');
    expect(replaceCompanyRecords).not.toHaveBeenCalled();
  });

  it('rejects a CSV with no rows selected', async () => {
    const form = new FormData();
    const { request } = await authedFormRequest(form);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_request');
  });

  it('rejects malformed CSV content (missing required header)', async () => {
    const form = new FormData();
    form.set('file', csvFile('company_number,company_status\n01234567,active'));
    const { request } = await authedFormRequest(form);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_csv');
    expect(replaceCompanyRecords).not.toHaveBeenCalled();
  });

  it('rejects a CSV whose rows are all empty/invalid', async () => {
    const form = new FormData();
    form.set('file', csvFile('company_name\n,\n  ,'));
    const { request } = await authedFormRequest(form);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('empty_import');
  });

  it('imports a valid CSV, reporting skipped and duplicate rows', async () => {
    const form = new FormData();
    form.set(
      'file',
      csvFile(
        [
          'company_name,company_number,company_status',
          'Acme Ltd,01234567,active',
          'Acme Ltd,01234567,active', // duplicate
          ',00000000', // empty name
          'Beta Corp,,dissolved',
        ].join('\n')
      )
    );
    const { request } = await authedFormRequest(form);

    (replaceCompanyRecords as jest.Mock).mockResolvedValue({ inserted: 2 });
    (db.companyRecord.count as jest.Mock).mockResolvedValue(2);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      imported: 2,
      totalRows: 4,
      skippedEmpty: 1,
      duplicates: 1,
      truncated: false,
      totalRecords: 2,
    });
    expect(replaceCompanyRecords).toHaveBeenCalledWith([
      { name: 'Acme Ltd', companyNumber: '01234567', status: 'active', address: undefined },
      { name: 'Beta Corp', companyNumber: undefined, status: 'dissolved', address: undefined },
    ]);
  });

  it('returns a safe 500 and makes no changes when the database write fails', async () => {
    const form = new FormData();
    form.set('file', csvFile('company_name\nAcme Ltd'));
    const { request } = await authedFormRequest(form);

    (replaceCompanyRecords as jest.Mock).mockRejectedValue(new Error('connection reset'));

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('internal_error');
  });
});

describe('GET /api/admin/companies/import', () => {
  afterEach(() => {
    clearMockAuthCookies();
    jest.clearAllMocks();
  });

  it('returns 401 when signed out', async () => {
    const response = await GET();
    expect(response.status).toBe(401);
  });
});
