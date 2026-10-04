import { PAGE_MAX, PAGE_SIZE_MAX, cleanQuery, companyDatabaseEnabled, getCompanyPrisma, searchCompanies } from '@/lib/company-db.server';

/**
 * GET /api/companies/search?q=…&page=1&limit=10
 * Optional feature: answers 404 unless COMPANY_DATABASE_URL is configured. Read-only, with fixed
 * queries (no caller-supplied SQL, fields or sorting), validated input, capped page size and a soft
 * per-IP rate limit. Responses carry only the fields the UI needs.
 */

// Soft per-instance rate limit (instances are reused under Fluid Compute); a burst guard, not a global guarantee.
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  if (hits.size > 500) hits.forEach((times, key) => { if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key); });
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const json = (body: unknown, status: number, headers?: HeadersInit) => Response.json(body, { status, headers });
/** Whole number within [min, max], or the fallback when absent; null if present but invalid. */
function intParam(value: string | null, fallback: number, min: number, max: number) {
  if (value === null || value === '') return fallback;
  return /^\d{1,3}$/.test(value) && +value >= min && +value <= max ? +value : null;
}

export async function GET(request: Request) {
  if (!companyDatabaseEnabled()) return json({ error: 'not_found' }, 404);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return json({ error: 'rate_limited' }, 429);

  const params = new URL(request.url).searchParams;
  const q = cleanQuery(params.get('q') ?? '');
  const page = intParam(params.get('page'), 1, 1, PAGE_MAX);
  const limit = intParam(params.get('limit'), 10, 1, PAGE_SIZE_MAX);
  if (!q || page === null || limit === null) return json({ error: 'invalid_request' }, 400);

  try {
    const prisma = getCompanyPrisma();
    if (!prisma) return json({ error: 'not_found' }, 404);
    const { results, hasMore } = await searchCompanies(prisma, q, page, limit);
    return json({ results, page, hasMore }, 200, { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' });
  } catch (err) {
    // Log the error code or name only: never connection details or the raw error.
    console.error('[companies] Search failed:', (err as { code?: string }).code ?? (err as Error).name);
    return json({ error: 'unavailable' }, 503);
  }
}
