import { isPin } from '@/lib/resume-access';
import { grantCookie, json } from '@/lib/resume-api.server';
import { verifyPin, verifyToken, type VerifyResult } from '@/lib/resume-store.server';
import { createRateLimit } from '@/lib/rate-limit.server';
import { isSameOrigin, trustedClientIp } from '@/lib/request.server';

export const dynamic = 'force-dynamic';
const limited = createRateLimit({ windowMs: 10 * 60 * 1000, max: 30 });
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Verifies a six-digit PIN ({ id, pin }) or the emailed link's token ({ token }). Success marks the request VERIFIED
 * and sets a short-lived, HTTP-only download grant; the PDF itself is only served by GET /api/resume/download.
 */
export async function POST(request: Request) {
  if (limited(`verify:${trustedClientIp(request) ?? 'unknown'}`)) return json({ error: 'rate_limited' }, 429);
  if (!isSameOrigin(request)) return json({ error: 'invalid_request' }, 403);
  let body: { id?: unknown; pin?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  let result: VerifyResult;
  if (typeof body.token === 'string' && TOKEN.test(body.token)) result = await verifyToken(body.token);
  else if (typeof body.id === 'string' && body.id.length <= 64 && isPin(body.pin)) result = await verifyPin(body.id, body.pin);
  else return json({ error: 'invalid' }, 400);

  if (!result.ok) return json({ error: result.reason }, result.reason === 'unavailable' ? 503 : result.reason === 'locked' ? 429 : 400);
  const seconds = Math.max(1, Math.floor((result.grantExpiresAt.getTime() - Date.now()) / 1000));
  return json({ ok: true }, 200, { 'Set-Cookie': grantCookie(result.grant, seconds) });
}
