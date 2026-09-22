import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/admin/companies/import/s3/route';
import { db } from '@/lib/database/db';
import { buildUser, buildSession } from '../../../test/factories';
import { authCookiesFor, clearMockAuthCookies } from '../../../test/testRequest';

jest.mock('@/lib/database/db');

const mockHeadObjectSend = jest.fn().mockResolvedValue({});
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockHeadObjectSend })),
  HeadObjectCommand: jest.fn().mockImplementation((input) => input),
}));

const ORIGIN = 'http://localhost:3000';
const URL = `${ORIGIN}/api/admin/companies/import/s3`;

const VALID_ENV = {
  COMPANIES_S3_URI: 's3://dw-portfoilo/BasicCompanyDataAsOneFile-2026.csv',
  AWS_S3_BUCKET: 'dw-portfoilo',
  AWS_S3_KEY: 'BasicCompanyDataAsOneFile-2026.csv',
  AWS_REGION: 'eu-west-2',
};

async function authedRequest(form: FormData | null, method: 'GET' | 'POST' = 'POST') {
  const user = buildUser();
  const session = buildSession({ userId: user.id });
  const cookies = await authCookiesFor({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });

  (db.user.findUnique as jest.Mock).mockResolvedValue(user);
  (db.session.findUnique as jest.Mock).mockResolvedValue(session);

  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');

  return new NextRequest(URL, {
    method,
    headers: { cookie: cookieHeader, origin: ORIGIN, host: 'localhost:3000' },
    ...(form ? { body: form } : {}),
  });
}

describe('/api/admin/companies/import/s3', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, ...VALID_ENV };
    mockHeadObjectSend.mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    clearMockAuthCookies();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  describe('POST', () => {
    it('returns 401 when there is no session', async () => {
      const form = new FormData();
      form.append('sourceUri', VALID_ENV.COMPANIES_S3_URI);
      const request = new NextRequest(URL, {
        method: 'POST',
        headers: { origin: ORIGIN, host: 'localhost:3000' },
        body: form,
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('rejects an arbitrary S3 URL instead of the configured source', async () => {
      const form = new FormData();
      form.append('sourceUri', 's3://attacker-bucket/whatever.csv');
      const request = await authedRequest(form);

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('unsupported_source');
    });

    it('rejects a missing sourceUri', async () => {
      const form = new FormData();
      const request = await authedRequest(form);

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('validates the exact configured source and reports it is ready to queue', async () => {
      (db.companyImportRun.findFirst as jest.Mock).mockResolvedValue(null);

      const form = new FormData();
      form.append('sourceUri', VALID_ENV.COMPANIES_S3_URI);
      const request = await authedRequest(form);

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.queued).toBe(true);
      expect(body.sourceKey).toBe('dw-portfoilo/BasicCompanyDataAsOneFile-2026.csv');
    });

    it('reports 202 with progress when a run is already in flight (idempotent trigger)', async () => {
      const runningRun = {
        id: 'run_1',
        status: 'running',
        rowCount: 5000,
        rejectedRows: 3,
        byteOffset: BigInt(1024),
        totalBytes: BigInt(2048),
        errorDetails: [],
        startedAt: new Date('2026-09-01T00:00:00Z'),
        completedAt: null,
        updatedAt: new Date('2026-09-01T00:05:00Z'),
      };
      (db.companyImportRun.findFirst as jest.Mock).mockResolvedValue(runningRun);

      const form = new FormData();
      form.append('sourceUri', VALID_ENV.COMPANIES_S3_URI);
      const request = await authedRequest(form);

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(202);
      expect(body.queued).toBe(false);
      expect(body.run.rowCount).toBe(5000);
      expect(body.run.byteOffset).toBe('1024');
    });

    it('fails closed (as an unsupported source) rather than guessing when env is misconfigured', async () => {
      process.env.AWS_S3_BUCKET = 'wrong-bucket';

      const form = new FormData();
      form.append('sourceUri', VALID_ENV.COMPANIES_S3_URI);
      const request = await authedRequest(form);

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('unsupported_source');
    });
  });

  describe('GET', () => {
    it('returns 401 when there is no session', async () => {
      const response = await GET();
      expect(response.status).toBe(401);
    });

    it('reports the latest run for the configured source', async () => {
      const run = {
        id: 'run_1',
        status: 'succeeded',
        rowCount: 5_600_000,
        rejectedRows: 12,
        byteOffset: BigInt(3_000_000_000),
        totalBytes: BigInt(3_000_000_000),
        errorDetails: [],
        startedAt: new Date('2026-09-01T00:00:00Z'),
        completedAt: new Date('2026-09-01T02:00:00Z'),
        updatedAt: new Date('2026-09-01T02:00:00Z'),
      };
      (db.companyImportRun.findFirst as jest.Mock).mockResolvedValue(run);

      await authedRequest(null, 'GET');
      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.run.status).toBe('succeeded');
      expect(body.run.rowCount).toBe(5_600_000);
      expect(body.run.byteOffset).toBe('3000000000');
    });

    it('returns null run when nothing has imported yet', async () => {
      (db.companyImportRun.findFirst as jest.Mock).mockResolvedValue(null);

      await authedRequest(null, 'GET');
      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.run).toBeNull();
    });

    it('reports a successful source check when the object is reachable', async () => {
      (db.companyImportRun.findFirst as jest.Mock).mockResolvedValue(null);
      mockHeadObjectSend.mockResolvedValue({});

      await authedRequest(null, 'GET');
      const response = await GET();
      const body = await response.json();

      expect(body.sourceCheck).toEqual({ ok: true, message: expect.any(String) });
    });

    it('categorizes an AccessDenied failure from the configured AWS S3 object', async () => {
      (db.companyImportRun.findFirst as jest.Mock).mockResolvedValue(null);
      mockHeadObjectSend.mockRejectedValue(
        Object.assign(new Error('Access Denied'), { name: 'AccessDenied', $metadata: { httpStatusCode: 403 } })
      );

      await authedRequest(null, 'GET');
      const response = await GET();
      const body = await response.json();

      expect(body.sourceCheck.ok).toBe(false);
      expect(body.sourceCheck.category).toBe('access_denied');
    });

    it('categorizes a region-redirect failure', async () => {
      (db.companyImportRun.findFirst as jest.Mock).mockResolvedValue(null);
      mockHeadObjectSend.mockRejectedValue(
        Object.assign(new Error('Redirect'), { name: 'PermanentRedirect', $metadata: { httpStatusCode: 301 } })
      );

      await authedRequest(null, 'GET');
      const response = await GET();
      const body = await response.json();

      expect(body.sourceCheck.ok).toBe(false);
      expect(body.sourceCheck.category).toBe('region_mismatch');
    });
  });
});
