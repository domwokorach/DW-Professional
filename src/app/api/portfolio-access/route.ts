import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { PORTFOLIO_ACCESS_URL } from '@/config';
import { normaliseCompanyNumber } from '@/lib/companies';
import { CONTENT_TYPES, extensionOf, matchesSignature, safeFilename } from '@/lib/contact';
import {
  ATTACHMENT_ERRORS, ATTACHMENT_MAX_BYTES, attachmentProblem, cleanAccess, validateAccess, type AccessFields,
} from '@/lib/portfolio-access';
import { accessEmailSubject, renderAccessEmail, type AccessEmailInput } from '@/lib/portfolio-access-email.server';
import {
  ADMIN_PORTFOLIO_ACCESS_PATH, adminSessionPath, recentAccessFromIp, setAccessNotificationStatus, storeAccess, type NewAttachment, type StoredAccess,
} from '@/lib/portfolio-access-store.server';
import { createRateLimit } from '@/lib/rate-limit.server';
import { deviceSummary, isSameOrigin, trustedClientIp, userAgent } from '@/lib/request.server';
import { getResend } from '@/lib/resend.server';

export const dynamic = 'force-dynamic';

/** Where access notifications go. Server-only: never sent to the browser. */
const NOTIFY_TO = process.env.PORTFOLIO_ACCESS_NOTIFY_EMAIL || 'dominic.wokorach-o@outlook.com';
const SOURCE = 'Portfolio Access QR Code';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Largest JSON body (no file): the fields are capped far below this, it just stops oversized posts early. */
const MAX_BODY = 8 * 1024;
/** Largest multipart body: the optional file plus room for the text fields. */
const MAX_MULTIPART = ATTACHMENT_MAX_BYTES + 64 * 1024;
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
  // The form posts multipart/form-data (it may carry a file); plain JSON is still accepted for submissions without one.
  const type = request.headers.get('content-type') ?? '';
  const multipart = type.includes('multipart/form-data');
  if (!multipart && !type.includes('application/json')) return json({ error: 'invalid_request' }, 400);
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > (multipart ? MAX_MULTIPART : MAX_BODY)) {
    return multipart ? json({ errors: { attachment: ATTACHMENT_ERRORS.size } }, 413) : json({ error: 'invalid_request' }, 413);
  }

  let body: Record<string, unknown>;
  let file: File | null = null;
  try {
    if (multipart) {
      const form = await request.formData();
      body = {};
      form.forEach((value, key) => {
        if (typeof value === 'string') body[key] = value;
        else if (key === 'attachment' && value.size > 0) file = value;
      });
    } else {
      const raw = await request.text();
      if (raw.length > MAX_BODY) throw new Error('size');
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('shape');
      body = parsed as Record<string, unknown>;
    }
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  // Honeypot: real visitors never see or fill this field.
  if (typeof body.website === 'string' && body.website) return json({ error: 'invalid_request' }, 400);

  const text = (key: string) => (typeof body[key] === 'string' ? (body[key] as string) : '');
  const raw: AccessFields = {
    fullName: text('fullName'), email: text('email'), mobile: text('mobile'), company: text('company'),
    linkedin: text('linkedin'), companyWebsite: text('companyWebsite'), portfolio: text('portfolio'),
  };
  const errors = validateAccess(raw);

  // The optional file: name, size and leading bytes are all checked here; the stored type comes from the
  // checked extension, never from what the browser claimed.
  let attachment: NewAttachment | undefined;
  const upload = file as File | null;
  if (upload) {
    const filename = safeFilename(upload.name || 'attachment');
    const problem = attachmentProblem({ name: filename, size: upload.size });
    if (problem) {
      errors.attachment = problem;
    } else {
      const data = Buffer.from(await upload.arrayBuffer());
      if (!matchesSignature(filename, data.subarray(0, 16))) errors.attachment = ATTACHMENT_ERRORS.content;
      else {
        attachment = {
          filename,
          mimeType: CONTENT_TYPES[extensionOf(filename) as keyof typeof CONTENT_TYPES],
          size: data.length,
          source: text('attachmentSource') === 'camera' ? 'camera' : 'upload',
          data,
        };
      }
    }
  }
  if (Object.keys(errors).length) return json({ errors }, 400);
  const fields = cleanAccess(raw);

  if (submissionLimited(`sub:${limitKey}`) || (await recentAccessFromIp(ip)) >= MAX_PER_HOUR) {
    return json({ error: 'rate_limited' }, 429);
  }

  // The form sends one id per submission and reuses it on retry; it keys both the stored submission and the email,
  // so a double click or a retry never duplicates either. A new submission from the same email updates that
  // candidate's session (see storeAccess).
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
  }, attachment);
  if (!stored) return json({ error: 'unavailable' }, 503);
  // The admin pages render per request; this also drops any cached copy so the session shows its update at once.
  revalidatePath(ADMIN_PORTFOLIO_ACCESS_PATH);
  revalidatePath(adminSessionPath(stored.id));
  // What the success screen confirms: the file that was saved with this submission, if any.
  const ok = { ok: true, attachment: attachment ? { filename: attachment.filename, size: attachment.size } : null };
  // A retry of a submission whose email already went out: don't notify twice.
  if (stored.repeat && stored.notificationStatus === 'SENT') return json(ok, 200);

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
    accessedAt: stored.submittedAt,
    submissionCount: stored.submissionCount,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dominicwokorach.me',
    attachment: attachment && { filename: attachment.filename, size: attachment.size, source: attachment.source },
  }, attachment);
  return json(ok, 200);
}

async function notify(submissionId: string, stored: StoredAccess, input: AccessEmailInput, file?: NewAttachment) {
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
      // Base64 is Resend's documented string form for attachments (as in /api/contact).
      attachments: file ? [{ filename: file.filename, content: file.data.toString('base64') }] : undefined,
    }, { idempotencyKey: `portfolio-access-${submissionId}` });
    if (error) throw new Error(error.name);
    await setAccessNotificationStatus(stored, 'SENT');
  } catch (err) {
    console.error('[portfolio-access] Notification email failed:', (err as Error).message);
    await setAccessNotificationStatus(stored, 'FAILED');
  }
}
