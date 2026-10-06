import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { PORTFOLIO_ACCESS_URL } from '@/config';
import { normaliseCompanyNumber } from '@/lib/companies';
import { cleanAccess, validateAccess, type AccessFields } from '@/lib/portfolio-access';
import { accessEmailSubject, renderAccessEmail, type AccessEmailInput } from '@/lib/portfolio-access-email.server';
import {
  ADMIN_PORTFOLIO_ACCESS_PATH, recentAccessFromIp, setAccessNotificationStatus, storeAccess, type StoredAccess,
} from '@/lib/portfolio-access-store.server';
import { createRateLimit } from '@/lib/rate-limit.server';
import { deviceSummary, isSameOrigin, trustedClientIp, userAgent } from '@/lib/request.server';
import { getResend } from '@/lib/resend.server';

export const dynamic = 'force-dynamic';

/** Where access notifications go. Server-only: never sent to the browser. */
const NOTIFY_TO = process.env.PORTFOLIO_ACCESS_NOTIFY_EMAIL || 'dominic.wokorach-o@outlook.com';
const SOURCE = 'Portfolio Access QR Code';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Largest body we'll read: the fields are capped far below this, it just stops oversized posts early. */
const MAX_BODY = 8 * 1024;
/** Database-wide cap (holds across instances): valid submissions per IP per hour. */
const MAX_PER_HOUR = 10;

// Soft per-instance limits (Fluid Compute reuses instances, so these stop bursts; not a global guarantee).
// Every request counts towards the loose cap; only valid submissions count towards the tight one, so someone
// fixing a few typos is never locked out.
const requestLimited = createRateLimit({ windowMs: 10 * 60 * 1000, max: 30 });
const submissionLimited = createRateLimit({ windowMs: 10 * 60 * 1000, max: 6 });

// Errors are deliberately generic codes: no internal, database or email-service details reach the browser.
const json = (body: unknown, status: number) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Records a Portfolio Access submission, then emails the notification. Success is returned only once the record is
 * saved in the database, so the page only opens the CV for a stored submission.
 */
export async function POST(request: Request) {
  const ip = trustedClientIp(request);
  const limitKey = ip ?? 'unknown';
  if (requestLimited(`req:${limitKey}`)) return json({ error: 'rate_limited' }, 429);
  if (!isSameOrigin(request)) return json({ error: 'invalid_request' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'invalid_request' }, 400);
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return json({ error: 'invalid_request' }, 413);

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) throw new Error('size');
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('shape');
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  // Honeypot: real visitors never see or fill this field.
  if (typeof body.website === 'string' && body.website) return json({ error: 'invalid_request' }, 400);

  const text = (key: string) => (typeof body[key] === 'string' ? (body[key] as string) : '');
  const raw: AccessFields = { fullName: text('fullName'), email: text('email'), mobile: text('mobile'), company: text('company') };
  const errors = validateAccess(raw);
  if (Object.keys(errors).length) return json({ errors }, 400);
  const fields = cleanAccess(raw);

  if (submissionLimited(`sub:${limitKey}`) || (await recentAccessFromIp(ip)) >= MAX_PER_HOUR) {
    return json({ error: 'rate_limited' }, 429);
  }

  // The form sends one id per submission and reuses it on retry; it keys both the stored row and the email,
  // so a double click or a retry never duplicates either.
  const sent = text('submissionId');
  const submissionId = UUID.test(sent) ? sent : randomUUID();
  // Only the number of a company picked from the suggestions; a name typed by hand needs none.
  const companyNumber = fields.company ? normaliseCompanyNumber(text('companyNumber')) : null;
  const device = deviceSummary(request);
  const ua = userAgent(request);

  // The record must be saved before anything else: without it the submission has not succeeded, so the page shows
  // a retry message and never opens the CV. The error details stay in the server log.
  const stored = await storeAccess(submissionId, {
    ...fields,
    companyNumber,
    device,
    userAgent: ua,
    ipAddress: ip,
    source: SOURCE,
    page: PORTFOLIO_ACCESS_URL,
  });
  if (!stored) return json({ error: 'unavailable' }, 503);
  // The admin list renders per request; this also drops any cached copy so the new record shows straight away.
  revalidatePath(ADMIN_PORTFOLIO_ACCESS_PATH);
  // A retry of a submission whose email already went out: don't notify twice.
  if (stored.notificationStatus === 'SENT') return json({ ok: true }, 200);

  // The record is saved, so the submission has succeeded whatever happens to the email: a failed notification is
  // logged and marked FAILED on the record (visible in the admin list), never reported to the candidate.
  await notify(submissionId, stored, {
    ...fields,
    companyNumber,
    device,
    userAgent: ua,
    ipAddress: ip,
    source: SOURCE,
    page: PORTFOLIO_ACCESS_URL,
    accessedAt: stored.createdAt,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dominicwokorach.me',
  });
  return json({ ok: true }, 200);
}

async function notify(submissionId: string, stored: StoredAccess, input: AccessEmailInput) {
  const resend = getResend();
  if (!resend) {
    console.error('[portfolio-access] Notification email is not configured: set RESEND_API_KEY.');
    await setAccessNotificationStatus(stored, 'FAILED');
    return;
  }
  const { html, text } = renderAccessEmail(input);
  try {
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
      to: [NOTIFY_TO],
      replyTo: input.email,
      subject: accessEmailSubject(input.fullName),
      text,
      html,
    }, { idempotencyKey: `portfolio-access-${submissionId}` });
    if (error) throw new Error(error.name);
    await setAccessNotificationStatus(stored, 'SENT');
  } catch (err) {
    console.error('[portfolio-access] Notification email failed:', (err as Error).message);
    await setAccessNotificationStatus(stored, 'FAILED');
  }
}
