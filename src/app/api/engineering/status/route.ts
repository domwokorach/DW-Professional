import { getEngineeringStatus, REVALIDATE_SECONDS, unavailableStatus } from '@/lib/engineering/status.server';
import { clientIp, createRateLimit } from '@/lib/rate-limit.server';

/**
 * GET /api/engineering/status
 * Live engineering status for the portfolio (latest CI run, last successful build, commit, deployment, test and
 * coverage numbers published by CI, Jenkins when reachable). Read server-side; no credential reaches a client and
 * upstream error details are never returned. Used by the website and the Expo app. Read-only.
 */
const rateLimited = createRateLimit({ windowMs: 60 * 1000, max: 30 });

export async function GET(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: 'Too many requests.' }, { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } });
  }
  try {
    const status = await getEngineeringStatus();
    return Response.json(status, { headers: { 'Cache-Control': status.stale ? 'public, s-maxage=60' : `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=600` } });
  } catch {
    // GitHub has never answered on this instance: report "unavailable" honestly (HTTP 200 so clients render it).
    return Response.json(unavailableStatus(), { headers: { 'Cache-Control': 'public, s-maxage=30' } });
  }
}
