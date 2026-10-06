import { normaliseCompanyNumber, type CompanyVerifyResponse } from '@/lib/companies';
import { companiesHouseEnabled } from '@/lib/companies-house.server';
import { companyDatabaseEnabled } from '@/lib/company-db.server';
import { lookupCompany } from '@/lib/company-lookup.server';
import { clientIp, createRateLimit } from '@/lib/rate-limit.server';

/**
 * GET /api/companies/verify?number=00445790
 * Called once when a visitor picks a company in the Company field: the latest details from
 * Companies House (server-side, with the server's API key), or the imported record if the live API
 * is unavailable. 404 when the feature isn't configured or the company isn't known; 503 when no
 * source could answer. Never returns upstream errors.
 */

const rateLimited = createRateLimit({ windowMs: 60 * 1000, max: 20 });
const json = (body: unknown, status: number, headers?: HeadersInit) => Response.json(body, { status, headers });

export async function GET(request: Request) {
  if (!companiesHouseEnabled() && !companyDatabaseEnabled()) return json({ error: 'not_found' }, 404);
  if (rateLimited(clientIp(request))) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' });

  const number = normaliseCompanyNumber(new URL(request.url).searchParams.get('number') ?? '');
  if (!number) return json({ error: 'invalid_request' }, 400);

  const found = await lookupCompany(number);
  if (found === 'not_found') return json({ error: 'not_found' }, 404);
  if (!found) return json({ error: 'unavailable' }, 503);
  const body: CompanyVerifyResponse = found;
  // Short private cache: a visitor re-selecting the same company doesn't call Companies House again.
  return json(body, 200, { 'Cache-Control': 'private, max-age=300' });
}
