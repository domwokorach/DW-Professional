import { parseReports } from '@/lib/csp-report';
import { createRateLimit } from '@/lib/rate-limit.server';
import { trustedClientIp } from '@/lib/request.server';

export const dynamic = 'force-dynamic';

const limited = createRateLimit({ windowMs: 60 * 1000, max: 30 });
/** Reports are tiny; anything larger is not a genuine report. */
const MAX_BYTES = 8 * 1024;
const ACCEPTED = ['application/csp-report', 'application/reports+json', 'application/json'];
const empty = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Receives Content-Security-Policy violation reports. Unauthenticated by necessity (browsers send them), so it only
 * accepts small JSON bodies, is rate limited, stores nothing, and logs a scrubbed summary (directive, blocked
 * origin and path, page path: never query strings, IP addresses or user agents).
 */
export async function POST(request: Request) {
  if (limited(trustedClientIp(request) ?? 'unknown')) return empty(429);
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!ACCEPTED.includes(type)) return empty(415);
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BYTES) return empty(413);
  let text: string;
  try {
    text = await request.text();
  } catch {
    return empty(400);
  }
  if (text.length > MAX_BYTES) return empty(413);
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return empty(400);
  }
  for (const v of parseReports(payload)) console.warn(`[csp-report] ${v.disposition} ${v.directive} blocked=${v.blocked || '-'} page=${v.page || '-'}`);
  return empty(204);
}
