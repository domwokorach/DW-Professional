import { COMPANY_RESULTS_MAX, type CompanySearchResponse } from '@/lib/companies';
import { companiesHouseEnabled } from '@/lib/companies-house.server';
import { cleanQuery, companyDatabaseEnabled } from '@/lib/company-db.server';
import { searchCompaniesCombined } from '@/lib/company-search.server';
import { clientIp, createRateLimit } from '@/lib/rate-limit.server';

/**
 * GET /api/companies/search?q=tesco[&limit=10]
 * Autocomplete for the Company field: live Companies House search (server-side, cached and throttled) merged with the
 * indexed company database (never the CSV). Each result says whether it is `live` or `cached`; `liveAvailable: false`
 * means only saved records were used. 404 unless COMPANIES_HOUSE_API_KEY or COMPANY_DATABASE_URL is configured, so the
 * field quietly stays a plain text input. Read-only, fixed queries with bound
 * parameters, validated input, at most 10 results, per-IP rate limit. Responses carry only what the
 * field shows and never error details.
 */

// The field debounces typing, so a person stays well under this; it stops scripted scraping.
const rateLimited = createRateLimit({ windowMs: 60 * 1000, max: 60 });

const json = (body: unknown, status: number, headers?: HeadersInit) => Response.json(body, { status, headers });

export async function GET(request: Request) {
  if (!companyDatabaseEnabled() && !companiesHouseEnabled()) return json({ error: 'not_found' }, 404);
  if (rateLimited(clientIp(request))) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' });

  const params = new URL(request.url).searchParams;
  const q = cleanQuery(params.get('q') ?? '');
  const rawLimit = params.get('limit');
  const limit = rawLimit === null || rawLimit === '' ? COMPANY_RESULTS_MAX : /^\d{1,2}$/.test(rawLimit) && +rawLimit >= 1 && +rawLimit <= COMPANY_RESULTS_MAX ? +rawLimit : null;
  if (!q || limit === null) return json({ error: 'invalid_request' }, 400);

  const result = await searchCompaniesCombined(q, limit);
  if (!result.answered) return json({ error: 'unavailable' }, 503);
  const body: CompanySearchResponse = { companies: result.companies, liveAvailable: result.liveAvailable };
  // A degraded answer (no live results) is cached only briefly, so live results return soon after Companies House does.
  return json(body, 200, { 'Cache-Control': result.liveAvailable ? 'public, s-maxage=300, stale-while-revalidate=600' : 'public, s-maxage=20' });
}
