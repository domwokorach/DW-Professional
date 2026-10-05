import { randomUUID } from 'node:crypto';
import { avatarsEnabled, checkAvatar, deleteAvatar, isAvatarKey } from '@/lib/avatar-store.server';
import { renderCommentEmail } from '@/lib/comment-email.server';
import { commentsEnabled, listApprovedComments, recentCommentsFromIp, setNotificationStatus, storeComment } from '@/lib/comment-store.server';
import { AVATAR_TOO_LARGE, cleanComment, validateComment, type CommentFields } from '@/lib/comments';
import { getResend } from '@/lib/resend.server';
import { clientIp, deviceSummary } from '@/lib/request.server';

// Always evaluated per request: the feed changes whenever a comment is approved.
export const dynamic = 'force-dynamic';

// Soft per-instance rate limits (instances are reused under Fluid Compute, so this stops bursts; it is not a
// global guarantee). Same approach as /api/contact, with two budgets so that a visitor fixing a few typos is
// never locked out: every request counts towards a loose cap, but only valid submissions count towards the
// tight one.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 40;
const MAX_SUBMISSIONS = 5;
/** Database-wide cap (holds across instances): valid comments per IP per hour. */
const MAX_PER_HOUR = 5;
/** Where moderation notifications go. */
const NOTIFY_TO = process.env.COMMENTS_NOTIFY_EMAIL || 'dominic.wokorach-o@outlook.com';
const hits = new Map<string, number[]>();

/** Records a hit under `key` and reports whether that key is now over `max` within the window. */
function overLimit(key: string, max: number) {
  const now = Date.now();
  if (hits.size > 1000) hits.forEach((times, k) => { if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k); });
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

const json = (body: unknown, status: number, headers?: HeadersInit) => Response.json(body, { status, headers });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Largest body we'll read: the fields are capped far below this, it just stops oversized posts early. */
const MAX_BODY = 16 * 1024;

/** The public feed: approved comments only, newest first. */
export async function GET() {
  if (!commentsEnabled()) return json({ comments: [], available: false }, 200);
  const comments = await listApprovedComments();
  if (comments === null) return json({ comments: [], available: false }, 200);
  // Short shared cache: an approval shows up within a minute without a request per visitor.
  return json({ comments, available: true }, 200, { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' });
}

/**
 * Submit a comment. Always saved as PENDING (a visitor can't choose the status), with the disclosed moderation
 * metadata (device, IP address, time) and the consent timestamp, then a notification goes to the moderator.
 * The response says nothing about the stored row beyond success.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (overLimit(`req:${ip}`, MAX_REQUESTS)) return json({ error: 'rate_limited' }, 429);

  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'invalid_request' }, 400);
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return json({ error: 'invalid_request' }, 413);

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('shape');
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  // Honeypot: real visitors never see or fill this field.
  if (typeof body.website === 'string' && body.website) return json({ error: 'invalid_request' }, 400);

  const text = (key: string) => (typeof body[key] === 'string' ? (body[key] as string) : '');
  const raw: CommentFields = { fullName: text('fullName'), email: text('email'), company: text('company'), comment: text('comment') };
  const consent = body.consent === true;
  const errors = validateComment(raw, consent);
  const avatarKey = text('avatarKey') || null;
  if (avatarKey && (!avatarsEnabled() || !isAvatarKey(avatarKey))) errors.avatar = 'That image could not be used. Please choose it again.';
  if (Object.keys(errors).length) return json({ errors }, 400);

  if (overLimit(`sub:${ip}`, MAX_SUBMISSIONS) || (await recentCommentsFromIp(ip)) >= MAX_PER_HOUR) {
    return json({ error: 'rate_limited' }, 429);
  }
  if (avatarKey) {
    const check = await checkAvatar(avatarKey);
    if (check !== 'ok') {
      await deleteAvatar(avatarKey); // a rejected upload is not kept
      return json({ errors: { avatar: check === 'too_large' ? AVATAR_TOO_LARGE : 'That file isn\u2019t a valid JPG, PNG or WebP image. Please choose another.' } }, 400);
    }
  }

  const sent = text('submissionId');
  const submissionId = UUID.test(sent) ? sent : randomUUID();
  const fields = cleanComment(raw);
  const device = deviceSummary(request);
  const stored = await storeComment(submissionId, { ...fields, avatarKey, device, ipAddress: ip, consentGivenAt: new Date() });
  if (!stored) return json({ error: commentsEnabled() ? 'send_failed' : 'unavailable' }, commentsEnabled() ? 502 : 503);
  // A retry of an already-saved comment: don't notify twice.
  if (stored.repeat && stored.notificationStatus === 'SENT') return json({ ok: true }, 200);

  // The comment is saved either way; a failed email is logged and marked so it can be spotted in the dashboard.
  const resend = getResend();
  if (!resend) {
    console.error('[comments] Notification email is not configured: set RESEND_API_KEY.');
    await setNotificationStatus(stored.id, 'FAILED');
    return json({ ok: true }, 200);
  }
  const { html, text: plain } = renderCommentEmail({
    ...fields,
    hasAvatar: Boolean(avatarKey),
    device,
    ipAddress: ip,
    submittedAt: stored.createdAt,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dominicwokorach.me',
  });
  try {
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
      to: [NOTIFY_TO],
      subject: `New Candidate Comment — ${fields.fullName}`.replace(/[\r\n]+/g, ' ').slice(0, 150),
      text: plain,
      html,
    }, { idempotencyKey: `comment-${submissionId}` });
    if (error) throw new Error(error.name);
    await setNotificationStatus(stored.id, 'SENT');
  } catch (err) {
    console.error('[comments] Notification email failed:', (err as Error).message);
    await setNotificationStatus(stored.id, 'FAILED');
  }
  return json({ ok: true }, 200);
}
