// End-to-end tests of the résumé verification API (real route handlers, real Postgres, stubbed mail transport).
// They need a throwaway database: TEST_DATABASE_URL=postgres://… with all migrations applied. Skipped otherwise.
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';

const URL_ = process.env.TEST_DATABASE_URL;
const skip = URL_ ? false : 'TEST_DATABASE_URL is not set';
if (URL_) {
  process.env.DATABASE_URL = URL_;
  delete process.env.PORTFOLIO_DATABASE_URL;
  process.env.TRUST_PROXY_HEADERS = 'true';
}

const ORIGIN = 'https://www.dominicwokorach.me';
const PDF = Buffer.from('%PDF-1.4\n% test résumé\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
type Mail = { to: string; subject: string; text: string; html: string };

describe('résumé verification flow', { skip }, () => {
  let routes: { request: typeof import('../src/app/api/resume/request/route'); verify: typeof import('../src/app/api/resume/verify/route'); resend: typeof import('../src/app/api/resume/resend/route'); download: typeof import('../src/app/api/resume/download/route') };
  let store: typeof import('../src/lib/resume-store.server');
  let prisma: NonNullable<ReturnType<typeof import('../src/lib/prisma.server')['getPrisma']>>;
  let setMailer: typeof import('../src/lib/resume-email.server')['useResumeMailer'];
  let inbox: Mail[] = [];
  let mailOk = true;
  let ipCounter = 0;

  before(async () => {
    routes = {
      request: await import('../src/app/api/resume/request/route'),
      verify: await import('../src/app/api/resume/verify/route'),
      resend: await import('../src/app/api/resume/resend/route'),
      download: await import('../src/app/api/resume/download/route'),
    };
    store = await import('../src/lib/resume-store.server');
    setMailer = (await import('../src/lib/resume-email.server')).useResumeMailer;
    prisma = (await import('../src/lib/prisma.server')).getPrisma()!;
    setMailer(async (mail) => { if (mailOk) inbox.push(mail); return mailOk; });
    await store.storeResumeFile('Test Resume.pdf', PDF);
  });
  after(async () => { setMailer(null); await prisma?.$disconnect(); });
  beforeEach(async () => {
    inbox = []; mailOk = true;
    await prisma.resumeAccess.deleteMany();
  });

  // Every call gets its own client IP so the soft per-instance limiter never interferes.
  const call = (path: string, body: unknown, extra: Record<string, string> = {}) =>
    new Request(`${ORIGIN}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, host: 'www.dominicwokorach.me', 'x-real-ip': `203.0.113.${(ipCounter++ % 250) + 1}`, 'user-agent': 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36', ...extra },
      body: JSON.stringify(body),
    });
  const person = { fullName: 'Jane Smith', email: 'Jane@Acme.com', company: 'Acme Recruitment' };
  const start = async (p = person, extra: Record<string, string> = {}) => {
    const res = await routes.request.POST(call('/api/resume/request', p, extra));
    return { res, body: (await res.json()) as Record<string, any> };
  };
  const pinOf = (mail: Mail) => /\n\s+(\d{6})\n/.exec(mail.text)![1];
  const tokenOf = (mail: Mail) => /#t=([A-Za-z0-9_-]{43})/.exec(mail.text)![1];
  const cookieOf = (res: Response) => /resume_grant=([^;]+)/.exec(res.headers.get('set-cookie') ?? '')?.[1];
  const get = (cookie?: string) => routes.download.GET(new Request(`${ORIGIN}/api/resume/download`, { headers: cookie ? { cookie: `resume_grant=${cookie}` } : {} }));

  test('request validates on the server and rejects cross-site and honeypot posts', async () => {
    const bad = await routes.request.POST(call('/api/resume/request', { fullName: '', email: 'x', company: '' }));
    assert.equal(bad.status, 422);
    assert.deepEqual(Object.keys((await bad.json()).errors).sort(), ['company', 'email', 'fullName']);
    assert.equal((await routes.request.POST(call('/api/resume/request', person, { origin: 'https://evil.example' }))).status, 403);
    assert.equal((await routes.request.POST(call('/api/resume/request', { ...person, website: 'spam' }))).status, 400);
    assert.equal(inbox.length, 0);
    assert.equal(await prisma.resumeAccess.count(), 0);
  });

  test('a valid request stores PENDING→EMAIL_SENT, emails one PIN + link, and stores no raw secrets', async () => {
    const { res, body } = await start();
    assert.equal(res.status, 200);
    assert.equal(inbox.length, 1);
    assert.equal(inbox[0].to, 'Jane@Acme.com');
    const pin = pinOf(inbox[0]);
    const token = tokenOf(inbox[0]);
    const row = await prisma.resumeAccess.findUniqueOrThrow({ where: { id: body.id } });
    assert.equal(row.status, 'EMAIL_SENT');
    assert.equal(row.source, 'Resume Download');
    assert.equal(row.emailKey, 'jane@acme.com');
    assert.equal(row.deviceModel, 'Samsung Galaxy (SM-S918B)');
    assert.equal(row.ipAddress?.startsWith('203.0.113.'), true);
    const dump = JSON.stringify(row);
    assert.ok(!dump.includes(pin) && !dump.includes(token), 'raw PIN/token must not be stored');
    assert.equal(row.expiresAt!.getTime() - Date.now() > 9 * 60 * 1000, true);
    assert.deepEqual((await prisma.resumeEvent.findMany({ where: { accessId: row.id }, orderBy: { createdAt: 'asc' } })).map((e) => e.type), ['REQUESTED', 'EMAIL_SENT']);
  });

  test('an email failure is reported as a failure and recorded as Delivery Failed', async () => {
    mailOk = false;
    const { res, body } = await start();
    assert.equal(res.status, 502);
    assert.equal(body.ok, undefined);
    const row = await prisma.resumeAccess.findFirstOrThrow();
    assert.equal(row.status, 'DELIVERY_FAILED');
    assert.equal(row.pinHash, null);
  });

  test('duplicate submissions inside the cooldown send one email and keep one record', async () => {
    const a = await start();
    const b = await start();
    const c = await start({ ...person, email: 'JANE@acme.COM' });
    assert.equal(a.body.id, b.body.id);
    assert.equal(a.body.id, c.body.id);
    assert.equal(inbox.length, 1);
    assert.equal(await prisma.resumeAccess.count(), 1);
    assert.deepEqual(Object.keys(b.body).sort(), Object.keys(a.body).sort(), 'same response shape: nothing reveals an earlier request');
  });

  test('wrong PINs are counted; after five the code is burned even for the right PIN', async () => {
    const { body } = await start();
    const pin = pinOf(inbox[0]);
    const wrong = pin === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) {
      const r = await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin: wrong }));
      assert.equal(r.status, 400);
      assert.equal((await r.json()).error, 'invalid');
    }
    const fifth = await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin: wrong }));
    assert.equal((await fifth.json()).error, 'locked');
    const right = await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin }));
    assert.notEqual(right.status, 200);
    assert.equal(cookieOf(right), undefined);
  });

  test('malformed PINs and tokens are rejected', async () => {
    const { body } = await start();
    for (const pin of ['12345', '1234567', 'abcdef', 123456, null]) {
      assert.equal((await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin }))).status, 400);
    }
    assert.equal((await routes.verify.POST(call('/api/resume/verify', { token: 'short' }))).status, 400);
    assert.equal((await routes.verify.POST(call('/api/resume/verify', { token: 'A'.repeat(43) }))).status, 400);
  });

  test('an expired code is refused for both the PIN and the link', async () => {
    const { body } = await start();
    const pin = pinOf(inbox[0]);
    const token = tokenOf(inbox[0]);
    await prisma.resumeAccess.update({ where: { id: body.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const byPin = await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin }));
    assert.equal((await byPin.json()).error, 'expired');
    const byToken = await routes.verify.POST(call('/api/resume/verify', { token }));
    assert.equal((await byToken.json()).error, 'expired');
    const row = await prisma.resumeAccess.findUniqueOrThrow({ where: { id: body.id } });
    assert.notEqual(row.status, 'VERIFIED');
    assert.equal((await store.listResumeForAdmin()).rows[0].status, 'EMAIL_SENT');
  });

  test('unverified visitors cannot download; a forged or random grant is refused', async () => {
    await start();
    assert.equal((await get()).status, 403);
    assert.equal((await get('A'.repeat(43))).status, 403);
    assert.equal((await get('not-a-grant')).status, 403);
    const row = await prisma.resumeAccess.findFirstOrThrow();
    assert.equal(row.downloadCount, 0);
  });

  test('correct PIN verifies, sets an HTTP-only grant, and the PDF downloads and is audited', async () => {
    const { body } = await start();
    const res = await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin: pinOf(inbox[0]) }));
    assert.equal(res.status, 200);
    const cookie = res.headers.get('set-cookie')!;
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    assert.match(cookie, /Path=\/api\/resume/);
    const grant = cookieOf(res)!;
    let row = await prisma.resumeAccess.findUniqueOrThrow({ where: { id: body.id } });
    assert.equal(row.status, 'VERIFIED');
    assert.ok(row.verifiedAt);
    assert.equal(row.pinHash, null);
    assert.ok(!JSON.stringify(row).includes(grant), 'grant stored only as a hash');

    const file = await get(grant);
    assert.equal(file.status, 200);
    assert.equal(file.headers.get('content-type'), 'application/pdf');
    assert.match(file.headers.get('content-disposition')!, /attachment; filename="Dominic-Wokorach-Olanya-Resume.pdf"/);
    assert.match(file.headers.get('cache-control')!, /no-store/);
    const bytes = Buffer.from(await file.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString('latin1'), '%PDF-');
    assert.deepEqual(bytes, PDF);
    assert.equal((await get(grant)).status, 200, 'the fallback button can download again within the grant lifetime');

    row = await prisma.resumeAccess.findUniqueOrThrow({ where: { id: body.id } });
    assert.equal(row.status, 'DOWNLOADED');
    assert.equal(row.downloadCount, 2);
    assert.ok(row.firstDownloadedAt && row.lastDownloadedAt);
    const types = (await prisma.resumeEvent.findMany({ where: { accessId: body.id } })).map((e) => e.type);
    assert.equal(types.filter((t) => t === 'DOWNLOADED').length, 2);
    assert.ok(types.includes('VERIFIED'));

    const admin = (await store.listResumeForAdmin()).rows[0];
    assert.deepEqual([admin.fullName, admin.company, admin.status, admin.downloadCount, admin.source], ['Jane Smith', 'Acme Recruitment', 'DOWNLOADED', 2, 'Resume Download']);
    assert.ok(admin.verifiedAt && admin.lastDownloadedAt && admin.createdAt && admin.lastActivityAt);
  });

  test('storage failures return a JSON error, never a successful file download', async () => {
    const { body } = await start();
    const res = await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin: pinOf(inbox[0]) }));
    const grant = cookieOf(res)!;
    try {
      await store.storeResumeFile('Broken.pdf', Buffer.from('{"not":"a pdf"}'));
      const notPdf = await get(grant);
      assert.equal(notPdf.status, 503);
      assert.match(notPdf.headers.get('content-type')!, /application\/json/);
      assert.deepEqual(await notPdf.json(), { error: 'storage_error' });

      await prisma.resumeFile.deleteMany();
      const missing = await get(grant);
      assert.equal(missing.status, 503);
      assert.match(missing.headers.get('content-type')!, /application\/json/);
      assert.match(missing.headers.get('cache-control')!, /no-store/);
    } finally {
      await store.storeResumeFile('Test Resume.pdf', PDF);
    }
    assert.equal((await get(grant)).status, 200, 'works again once a valid PDF is stored');
  });

  test('the same PIN cannot be used twice, and an expired grant stops working', async () => {
    const { body } = await start();
    const pin = pinOf(inbox[0]);
    const first = await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin }));
    assert.equal(first.status, 200);
    assert.equal((await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin }))).status, 400);
    await prisma.resumeAccess.update({ where: { id: body.id }, data: { grantExpiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await get(cookieOf(first))).status, 403);
  });

  test('the emailed link works once: concurrent and later replays are refused', async () => {
    const { body } = await start();
    const token = tokenOf(inbox[0]);
    const pin = pinOf(inbox[0]);
    const results = await Promise.all([1, 2, 3].map(() => routes.verify.POST(call('/api/resume/verify', { token }))));
    assert.equal(results.filter((r) => r.status === 200).length, 1, 'exactly one request wins the race');
    assert.equal((await routes.verify.POST(call('/api/resume/verify', { token }))).status, 400);
    assert.equal((await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin }))).status, 400, 'the PIN dies with the link');
    const winner = results.find((r) => r.status === 200)!;
    assert.equal((await get(cookieOf(winner))).status, 200);
  });

  test('resend: cooldown, fresh code replaces the old one, send limit, unknown ids look normal', async () => {
    const { body } = await start();
    const oldPin = pinOf(inbox[0]);
    const tooSoon = await routes.resend.POST(call('/api/resume/resend', { id: body.id }));
    assert.equal(tooSoon.status, 429);
    assert.equal(inbox.length, 1);

    const back = () => prisma.resumeAccess.update({ where: { id: body.id }, data: { lastSentAt: new Date(Date.now() - 61_000) } });
    await back();
    const ok = await routes.resend.POST(call('/api/resume/resend', { id: body.id }));
    assert.equal(ok.status, 200);
    assert.equal(inbox.length, 2);
    const newPin = pinOf(inbox[1]);
    if (newPin !== oldPin) assert.equal((await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin: oldPin }))).status, 400, 'old code is replaced');

    for (let i = 0; i < 2; i++) { await back(); assert.equal((await routes.resend.POST(call('/api/resume/resend', { id: body.id }))).status, 200); }
    assert.equal(inbox.length, 4);
    await back();
    assert.equal((await routes.resend.POST(call('/api/resume/resend', { id: body.id }))).status, 429, 'four emails an hour at most');
    assert.equal(inbox.length, 4);

    const unknown = await routes.resend.POST(call('/api/resume/resend', { id: 'does-not-exist' }));
    assert.equal(unknown.status, 200);
    assert.equal(inbox.length, 4);
  });

  test('a resend whose email fails is reported as failed', async () => {
    const { body } = await start();
    await prisma.resumeAccess.update({ where: { id: body.id }, data: { lastSentAt: new Date(Date.now() - 61_000) } });
    mailOk = false;
    assert.equal((await routes.resend.POST(call('/api/resume/resend', { id: body.id }))).status, 502);
  });

  test('a returning, already-verified candidate keeps history but must verify again', async () => {
    const { body } = await start();
    const first = await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin: pinOf(inbox[0]) }));
    await get(cookieOf(first));
    await prisma.resumeAccess.update({ where: { id: body.id }, data: { lastSentAt: new Date(Date.now() - 61_000) } });
    const again = await start();
    assert.equal(again.body.id, body.id);
    const row = await prisma.resumeAccess.findUniqueOrThrow({ where: { id: body.id } });
    assert.equal(row.status, 'DOWNLOADED');
    assert.equal(row.downloadCount, 1);
    assert.ok(row.pinHash, 'a fresh code was issued');
    assert.equal(inbox.length, 2);
    const second = await routes.verify.POST(call('/api/resume/verify', { id: body.id, pin: pinOf(inbox[1]) }));
    assert.equal(second.status, 200, 'the new code verifies');
  });

  test('retention: records past the retention period are deleted with their events', async () => {
    const { body } = await start();
    await prisma.resumeAccess.update({ where: { id: body.id }, data: { lastActivityAt: new Date(Date.now() - 400 * 24 * 3600 * 1000) } });
    assert.equal(await store.purgeOldResumeRecords(365), 1);
    assert.equal(await prisma.resumeEvent.count(), 0);
  });

  test('responses are never cached and reveal no internals', async () => {
    const { res } = await start();
    assert.equal(res.headers.get('cache-control'), 'no-store');
    const denied = await get();
    assert.equal(denied.headers.get('cache-control'), 'no-store');
    assert.ok(!JSON.stringify(await denied.json()).match(/prisma|stack|postgres/i));
  });
});
