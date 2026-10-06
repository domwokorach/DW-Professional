import { COMPANY_RESULTS_MAX, type CompanySearchResponse } from '@/lib/companies';
import { cleanQuery, companyDatabaseEnabled, getCompanyPrisma, searchCompanies } from '@/lib/company-db.server';
import { clientIp, createRateLimit } from '@/lib/rate-limit.server';

/**
 * GET /api/companies/search?q=tesco[&limit=10]
 * Autocomplete for the contact form's Company field, served from the imported company database
 * (never the CSV, never Companies House per keystroke). 404 unless COMPANY_DATABASE_URL is
 * configured, so the field quietly stays a plain text input. Read-only, fixed queries with bound
 * parameters, validated input, at most 10 results, per-IP rate limit. Responses carry only what the
 * field shows and never error details.
 */

// The field debounces typing, so a person stays well under this; it stops scripted scraping.
const rateLimited = createRateLimit({ windowMs: 60 * 1000, max: 60 });

const json = (body: unknown, status: number, headers?: HeadersInit) => Response.json(body, { status, headers });

export async function GET(request: Request) {
  if (!companyDatabaseEnabled()) return json({ error: 'not_found' }, 404);
  if (rateLimited(clientIp(request))) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' });

  const params = new URL(request.url).searchParams;
  const q = cleanQuery(params.get('q') ?? '');
  const rawLimit = params.get('limit');
  const limit = rawLimit === null || rawLimit === '' ? COMPANY_RESULTS_MAX : /^\d{1,2}$/.test(rawLimit) && +rawLimit >= 1 && +rawLimit <= COMPANY_RESULTS_MAX ? +rawLimit : null;
  if (!q || limit === null) return json({ error: 'invalid_request' }, 400);

  try {
    const prisma = getCompanyPrisma();
    if (!prisma) return json({ error: 'not_found' }, 404);
    const body: CompanySearchResponse = { companies: await searchCompanies(prisma, q, limit) };
    return json(body, 200, { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' });
  } catch (err) {
    // Log the error code or name only: never connection details or the raw error.
    console.error('[companies] Search failed:', (err as { code?: string }).code ?? (err as Error).name);
    return json({ error: 'unavailable' }, 503);
  }
}
