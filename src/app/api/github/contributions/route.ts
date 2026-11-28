import { getContributions, githubConfigured } from '@/lib/github-contributions.server';
import type { ContributionResponse } from '@/lib/github-contributions';
import { clientIp, createRateLimit } from '@/lib/rate-limit.server';

/**
 * GET /api/github/contributions[?year=2025]
 * The owner's public GitHub contribution calendar, fetched server-side with GITHUB_TOKEN (never exposed). Without
 * `year` it is the rolling last 12 months. Used by the website and the Expo app. Read-only, validated input,
 * per-IP rate limit; responses carry only calendar data and an error code, never error details or the token.
 * CORS is open because the data is public and no credentials are involved.
 */

const rateLimited = createRateLimit({ windowMs: 60 * 1000, max: 30 });
const CORS = { 'Access-Control-Allow-Origin': '*' };
const STATUS = { not_configured: 503, rate_limited: 503, not_found: 404, unavailable: 502, invalid_request: 400 } as const;

const json = (body: ContributionResponse, status: number, headers?: HeadersInit) =>
  Response.json(body, { status, headers: { ...CORS, ...headers } });

export async function GET(request: Request) {
  if (rateLimited(clientIp(request))) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' });
  if (!githubConfigured()) return json({ error: 'not_configured' }, 503, { 'Cache-Control': 'no-store' });

  const raw = new URL(request.url).searchParams.get('year');
  let year: number | null = null;
  if (raw !== null && raw !== '' && raw !== 'rolling') {
    year = /^\d{4}$/.test(raw) ? Number(raw) : NaN;
    if (!(year >= 2008 && year <= new Date().getUTCFullYear())) return json({ error: 'invalid_request' }, 400);
  }

  const result = await getContributions(year);
  if (!result.data) return json(result, STATUS[result.error ?? 'unavailable'], { 'Cache-Control': 'no-store' });
  // A stale answer is cached only briefly so fresh data returns soon after GitHub does.
  return json(result, 200, {
    'Cache-Control': result.stale ? 'public, s-maxage=60' : 'public, s-maxage=3600, stale-while-revalidate=86400',
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } });
}
