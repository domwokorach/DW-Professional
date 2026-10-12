// Server-only: the Companies House public data API (live company profiles). COMPANIES_HOUSE_API_KEY
// is read here and nowhere else; it is sent only to Companies House, as HTTP Basic auth, and never
// logged, returned or exposed to the browser. The OAuth client (COMPANIES_HOUSE_CLIENT_ID/SECRET) is
// a different credential for filing on behalf of users; public reads like this don't use it.

const API_BASE = 'https://api.company-information.service.gov.uk';
const TIMEOUT_MS = 4000;
/** Profiles change rarely; this also keeps us far inside the API's 600 requests per 5 minutes. */
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 500;
/**
 * Companies House allows 600 requests per 5 minutes per key. This instance spends at most this many (searches and
 * profiles together), leaving headroom for other instances and the importer; beyond it live calls are skipped and
 * the caller falls back to saved records until the window frees up.
 */
const UPSTREAM_BUDGET = 400;
const UPSTREAM_WINDOW_MS = 5 * 60 * 1000;
const SEARCH_TTL_MS = 10 * 60 * 1000;

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

const spent: number[] = [];
/** True (and counts the call) while this instance is inside its upstream budget. Exported for tests. */
export function takeUpstreamSlot(now = Date.now()): boolean {
  while (spent.length && now - spent[0] >= UPSTREAM_WINDOW_MS) spent.shift();
  if (spent.length >= UPSTREAM_BUDGET) return false;
  spent.push(now);
  return true;
}
export const resetUpstreamBudget = () => { spent.length = 0; };

const authHeaders = (key: string) => ({ Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`, Accept: 'application/json' });

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

  if (!takeUpstreamSlot()) return 'unavailable';
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/company/${encodeURIComponent(companyNumber)}`, {
      headers: authHeaders(key),
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

// ---- Live search ------------------------------------------------------------------------------------------

/** One hit from GET /search/companies: what the autocomplete shows. */
export type LiveSearchHit = {
  companyNumber: string;
  companyName: string;
  status: string | null;
  companyType: string | null;
  /** Companies House's one-line address snippet. */
  addressSnippet: string | null;
  locality: string | null;
  postcode: string | null;
};

type SearchResponse = {
  items?: {
    company_number?: string;
    title?: string;
    company_status?: string;
    company_type?: string;
    address_snippet?: string;
    address?: { locality?: string; postal_code?: string };
  }[];
};

export function toLiveHits(data: SearchResponse): LiveSearchHit[] {
  const hits: LiveSearchHit[] = [];
  for (const item of data.items ?? []) {
    const number = str(item.company_number)?.toUpperCase();
    const name = str(item.title);
    if (!number || !name) continue;
    hits.push({
      companyNumber: number,
      companyName: name,
      status: str(item.company_status),
      companyType: str(item.company_type),
      addressSnippet: str(item.address_snippet),
      locality: str(item.address?.locality),
      postcode: str(item.address?.postal_code)?.toUpperCase() ?? null,
    });
  }
  return hits;
}

export type LiveSearchResult = { hits: LiveSearchHit[] } | 'unavailable';
const searchCache = new Map<string, { at: number; result: { hits: LiveSearchHit[] } }>();
const inFlight = new Map<string, Promise<LiveSearchResult>>();

/**
 * Companies House name/number search (server-side only, with this site's key). `queryKey` is the normalised query used
 * for caching: answers are kept 10 minutes per instance and identical concurrent searches share one upstream call.
 * 'unavailable' for no key, an exhausted budget, a rate limit (429), an outage or a timeout; never throws, never logs the key.
 */
export async function searchCompaniesLive(query: string, queryKey: string, limit = 10): Promise<LiveSearchResult> {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) return 'unavailable';
  const cacheKey = `${queryKey}\u0000${limit}`;
  const hit = searchCache.get(cacheKey);
  if (hit && Date.now() - hit.at < SEARCH_TTL_MS) return hit.result;
  const pending = inFlight.get(cacheKey);
  if (pending) return pending;
  if (!takeUpstreamSlot()) return 'unavailable';

  const run = (async (): Promise<LiveSearchResult> => {
    try {
      const url = `${API_BASE}/search/companies?q=${encodeURIComponent(query)}&items_per_page=${limit}`;
      const res = await fetch(url, { headers: authHeaders(key), signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' });
      if (!res.ok) {
        console.warn('[companies-house] Search responded', res.status);
        return 'unavailable';
      }
      const result = { hits: toLiveHits((await res.json().catch(() => ({}))) as SearchResponse) };
      if (searchCache.size >= CACHE_MAX) searchCache.delete(searchCache.keys().next().value!);
      searchCache.set(cacheKey, { at: Date.now(), result });
      return result;
    } catch (err) {
      console.warn('[companies-house] Search failed:', (err as Error).name);
      return 'unavailable';
    } finally {
      inFlight.delete(cacheKey);
    }
  })();
  inFlight.set(cacheKey, run);
  return run;
}

/** Clears the in-memory caches (tests). */
export function resetCompaniesHouseCaches() {
  cache.clear();
  searchCache.clear();
  inFlight.clear();
  resetUpstreamBudget();
}
