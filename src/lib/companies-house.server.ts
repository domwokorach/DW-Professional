// Server-only: the Companies House public data API (live company profiles). COMPANIES_HOUSE_API_KEY
// is read here and nowhere else; it is sent only to Companies House, as HTTP Basic auth, and never
// logged, returned or exposed to the browser. The OAuth client (COMPANIES_HOUSE_CLIENT_ID/SECRET) is
// a different credential for filing on behalf of users; public reads like this don't use it.

const API_BASE = 'https://api.company-information.service.gov.uk';
const TIMEOUT_MS = 4000;
/** Profiles change rarely; this also keeps us far inside the API's 600 requests per 5 minutes. */
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 500;

export const companiesHouseEnabled = () => Boolean(process.env.COMPANIES_HOUSE_API_KEY);

/** The fields of a company profile this site uses. */
export type CompanyProfile = {
  companyNumber: string;
  companyName: string;
  status: string | null;
  companyType: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postTown: string | null;
  county: string | null;
  country: string | null;
  postcode: string | null;
};

type ProfileResponse = {
  company_number?: string;
  company_name?: string;
  company_status?: string;
  type?: string;
  registered_office_address?: {
    premises?: string;
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    region?: string;
    country?: string;
    postal_code?: string;
  };
};

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

function toProfile(data: ProfileResponse, requested: string): CompanyProfile | null {
  const name = str(data.company_name);
  if (!name) return null;
  const a = data.registered_office_address ?? {};
  // "premises" is the building name or number; Companies House shows it before the first line.
  const line1 = [str(a.premises), str(a.address_line_1)].filter(Boolean).join(' ') || null;
  return {
    companyNumber: str(data.company_number)?.toUpperCase() ?? requested,
    companyName: name,
    status: str(data.company_status),
    companyType: str(data.type),
    addressLine1: line1,
    addressLine2: str(a.address_line_2),
    postTown: str(a.locality),
    county: str(a.region),
    country: str(a.country),
    postcode: str(a.postal_code)?.toUpperCase() ?? null,
  };
}

type Result = { profile: CompanyProfile } | 'not_found' | 'unavailable';
const cache = new Map<string, { at: number; result: Result }>();

/**
 * The current profile for one company number (already normalised to 8 characters).
 * 'not_found' when Companies House has no such company; 'unavailable' for anything else (no key,
 * rate limit, timeout, outage). Successful and not-found answers are cached per server instance.
 */
export async function getCompanyProfile(companyNumber: string): Promise<Result> {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) return 'unavailable';

  const hit = cache.get(companyNumber);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/company/${encodeURIComponent(companyNumber)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store', // cached above instead, so the auth header never becomes part of a shared fetch-cache entry
    });
  } catch (err) {
    console.warn('[companies-house] Request failed:', (err as Error).name);
    return 'unavailable';
  }

  let result: Result;
  if (res.status === 404) {
    result = 'not_found';
  } else if (!res.ok) {
    // Status only: 401 means the key is wrong, 429 the rate limit. Never the body or the key.
    console.warn('[companies-house] Responded', res.status);
    return 'unavailable';
  } else {
    const profile = toProfile((await res.json().catch(() => ({}))) as ProfileResponse, companyNumber);
    if (!profile) return 'unavailable';
    result = { profile };
  }

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(companyNumber, { at: Date.now(), result });
  return result;
}
