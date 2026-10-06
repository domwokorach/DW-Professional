import { normaliseUrl } from '@/lib/portfolio-access';
import { createRateLimit } from '@/lib/rate-limit.server';
import { isSameOrigin, trustedClientIp } from '@/lib/request.server';
import { fetchSitePreview, PreviewError } from '@/lib/site-preview.server';

export const dynamic = 'force-dynamic';

// Each import makes an outbound request, so it's limited more tightly than the form itself.
const limited = createRateLimit({ windowMs: 10 * 60 * 1000, max: 15 });
const json = (body: unknown, status: number) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * POST { url } → { preview: { url, host, name, description } }, for the Portfolio Access "Import" button.
 * Same-origin pages only, rate limited per IP, and the fetch itself is SSRF-protected (site-preview.server.ts).
 * Errors are short codes: never the fetched page's response or network details.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: 'invalid_request' }, 403);
  if (limited(trustedClientIp(request) ?? 'unknown')) return json({ error: 'rate_limited' }, 429);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'invalid_request' }, 400);
  let raw = '';
  try {
    const body = (await request.json()) as { url?: unknown };
    raw = typeof body?.url === 'string' ? body.url : '';
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }
  const href = raw.length <= 300 ? normaliseUrl(raw) : null;
  if (!href) return json({ error: 'invalid_url' }, 400);
  try {
    return json({ preview: await fetchSitePreview(href) }, 200);
  } catch (err) {
    const code = err instanceof PreviewError ? err.code : 'unreachable';
    return json({ error: code === 'blocked' ? 'invalid_url' : 'unreachable' }, 422);
  }
}
