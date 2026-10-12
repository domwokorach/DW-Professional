import { cleanResume, validateResume, type ResumeFields } from '@/lib/resume-access';
import { emailCode, json, requestMeta } from '@/lib/resume-api.server';
import { resolveResumeCompany } from '@/lib/resume-company.server';
import { markEmailResult, recentResumeFromIp, requestResume } from '@/lib/resume-store.server';
import { createRateLimit } from '@/lib/rate-limit.server';
import { isSameOrigin, trustedClientIp } from '@/lib/request.server';

export const dynamic = 'force-dynamic';
const MAX_BODY = 4 * 1024;
const MAX_PER_HOUR = 10;
const requestLimited = createRateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

/**
 * Starts (or refreshes) a résumé request and emails the PIN and link. The answer is the same whether or not the
 * address was seen before, and success is only reported once the email was accepted for delivery.
 */
export async function POST(request: Request) {
  const ip = trustedClientIp(request);
  if (requestLimited(`req:${ip ?? 'unknown'}`)) return json({ error: 'rate_limited' }, 429);
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

  const text = (k: string) => (typeof body[k] === 'string' ? (body[k] as string) : '');
  const fields: ResumeFields = { fullName: text('fullName'), email: text('email'), company: text('company') };
  const errors = validateResume(fields);
  if (Object.keys(errors).length) return json({ errors }, 422);

  if ((await recentResumeFromIp(ip)) >= MAX_PER_HOUR) return json({ error: 'rate_limited' }, 429);

  const cleaned = cleanResume(fields);
  const company = await resolveResumeCompany(cleaned.company, body.companyNumber);
  const result = await requestResume({ ...cleaned, company: company.name }, requestMeta(request), company);
  if (result.kind === 'unavailable') return json({ error: 'unavailable' }, 503);
  if (result.kind === 'cooldown') return json({ ok: true, id: result.id, expiresAt: result.expiresAt?.toISOString() ?? null });

  const sent = await emailCode(result.code, result.fullName, result.email, 'request');
  await markEmailResult(result.code.id, sent);
  if (!sent) return json({ error: 'email_failed' }, 502);
  return json({ ok: true, id: result.code.id, expiresAt: result.code.expiresAt.toISOString() });
}
