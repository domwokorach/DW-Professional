import { emailCode, json } from '@/lib/resume-api.server';
import { markEmailResult, resendResume } from '@/lib/resume-store.server';
import { createRateLimit } from '@/lib/rate-limit.server';
import { isSameOrigin, trustedClientIp } from '@/lib/request.server';

export const dynamic = 'force-dynamic';
const limited = createRateLimit({ windowMs: 10 * 60 * 1000, max: 10 });

/** Sends a fresh PIN and link for an existing request, within the cooldown and send limits. */
export async function POST(request: Request) {
  if (limited(`resend:${trustedClientIp(request) ?? 'unknown'}`)) return json({ error: 'rate_limited' }, 429);
  if (!isSameOrigin(request)) return json({ error: 'invalid_request' }, 403);
  let id: unknown;
  try {
    id = ((await request.json()) as { id?: unknown }).id;
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }
  if (typeof id !== 'string' || id.length > 64) return json({ error: 'invalid_request' }, 400);

  const result = await resendResume(id);
  if (result.kind === 'unavailable') return json({ error: 'unavailable' }, 503);
  if (result.kind === 'cooldown') return json({ error: 'too_soon' }, 429);
  // An unknown id looks like a normal success, so ids cannot be probed.
  if (result.kind === 'ignored') return json({ ok: true, expiresAt: null });

  const sent = await emailCode(result.code, result.fullName, result.email, 'resend');
  await markEmailResult(result.code.id, sent, true);
  if (!sent) return json({ error: 'email_failed' }, 502);
  return json({ ok: true, expiresAt: result.code.expiresAt.toISOString() });
}
