import { getContributions, GitHubError, REVALIDATE_SECONDS } from '@/lib/github/contributions.server';
import type { ContributionsErrorBody, ContributionsErrorCode } from '@/lib/github/types';
import { clientIp, createRateLimit } from '@/lib/rate-limit.server';

/**
 * GET /api/github/contributions[?year=2025]
 * The public contribution calendar for the portfolio owner, read server-side from GitHub's GraphQL API with GITHUB_TOKEN
 * (never sent to a client). No `year` = rolling last 12 months. Used by the website and the Expo app, so neither holds a
 * token. Read-only; the year is validated; responses carry counts and dates only, never error details.
 */
const rateLimited = createRateLimit({ windowMs: 60 * 1000, max: 30 });

const STATUS: Record<ContributionsErrorCode, number> = {
  not_configured: 503, rate_limited: 429, unauthorized: 502, not_found: 404, year_unavailable: 404, invalid_request: 400, upstream: 502,
};
const CACHE_OK = `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=86400`;

const fail = (code: ContributionsErrorCode, message: string, retryAfter?: number) => {
  const body: ContributionsErrorBody = { error: { code, message, ...(retryAfter ? { retryAfter } : {}) } };
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (retryAfter) headers['Retry-After'] = String(retryAfter);
  return Response.json(body, { status: STATUS[code], headers });
};

export async function GET(request: Request) {
  if (rateLimited(clientIp(request))) return fail('rate_limited', 'Too many requests.', 60);

  const raw = new URL(request.url).searchParams.get('year');
  if (raw !== null && !/^\d{4}$/.test(raw)) return fail('invalid_request', 'Unsupported year.');

  try {
    const payload = await getContributions(raw === null ? null : Number(raw));
    // A stale copy is cached only briefly so fresh data returns soon after GitHub recovers.
    return Response.json(payload, { headers: { 'Cache-Control': payload.stale ? 'public, s-maxage=60' : CACHE_OK } });
  } catch (error) {
    if (error instanceof GitHubError) return fail(error.code, error.message, error.retryAfter);
    return fail('upstream', 'GitHub activity is unavailable.');
  }
}
