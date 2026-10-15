// The public recruiter route behind the Developer ID QR code (real handler, real Postgres).
// Needs a throwaway database: TEST_DATABASE_URL=postgres://… with all migrations applied. Skipped otherwise.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

const URL_ = process.env.TEST_DATABASE_URL;
const skip = URL_ ? false : 'TEST_DATABASE_URL is not set';
if (URL_) {
  process.env.DATABASE_URL = URL_;
  delete process.env.PORTFOLIO_DATABASE_URL;
}

const PDF = Buffer.from('%PDF-1.4\n% test résumé\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const req = (ip = '198.51.100.7') => new Request('https://www.dominicwokorach.me/api/resume/quick-download', { headers: { 'x-forwarded-for': ip } });

describe('quick-download (public recruiter route)', { skip }, () => {
  let route: typeof import('../src/app/api/resume/quick-download/route');
  let store: typeof import('../src/lib/resume-store.server');
  let prisma: NonNullable<ReturnType<typeof import('../src/lib/prisma.server')['getPrisma']>>;

  before(async () => {
    route = await import('../src/app/api/resume/quick-download/route');
    store = await import('../src/lib/resume-store.server');
    prisma = (await import('../src/lib/prisma.server')).getPrisma()!;
  });
  after(async () => { await store.storeResumeFile('Test Resume.pdf', PDF); await prisma?.$disconnect(); });

  test('serves the PDF as an attachment with the required headers, without any cookie or login', async () => {
    await store.storeResumeFile('Anything.pdf', PDF);
    const res = await route.GET(req());
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/pdf');
    assert.equal(res.headers.get('content-disposition'), 'attachment; filename="resume.pdf"');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    const bytes = Buffer.from(await res.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString('latin1'), '%PDF-');
    assert.deepEqual(bytes, PDF);
    assert.equal(res.headers.get('content-length'), String(PDF.length));
  });

  test('a missing résumé shows an HTML page with a Download PDF fallback, never a file, and is not cached', async () => {
    await prisma.resumeFile.deleteMany();
    const res = await route.GET(req('198.51.100.8'));
    assert.equal(res.status, 503);
    assert.match(res.headers.get('content-type')!, /text\/html/);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(res.headers.get('content-disposition'), null);
    assert.match(await res.text(), /Download PDF/);
  });

  test('stored bytes that are not a PDF are refused (no JSON or HTML saved as resume.pdf)', async () => {
    await store.storeResumeFile('Broken.pdf', Buffer.from('{"not":"a pdf"}'));
    const res = await route.GET(req('198.51.100.9'));
    assert.equal(res.status, 503);
    assert.match(res.headers.get('content-type')!, /text\/html/);
    assert.equal(res.headers.get('cache-control'), 'no-store');
  });

  test('is rate limited per client and the limit response is not cached', async () => {
    await store.storeResumeFile('Test Resume.pdf', PDF);
    let last: Response | undefined;
    for (let i = 0; i < 40; i++) last = await route.GET(req('198.51.100.99'));
    assert.equal(last!.status, 429);
    assert.equal(last!.headers.get('cache-control'), 'no-store');
  });
});
