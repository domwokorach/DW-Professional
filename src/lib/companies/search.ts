import type { CompanySearchResult } from "@/types/company";

export const COMPANY_SEARCH_MIN_QUERY_LENGTH = 2;
export const COMPANY_SEARCH_MAX_QUERY_LENGTH = 160;
export const COMPANY_SEARCH_RESULT_LIMIT = 20;

// A single A–Z browse letter is a valid query on its own even though it's
// shorter than COMPANY_SEARCH_MIN_QUERY_LENGTH — see the A–Z filter in
// CompanyAutocomplete.
export const COMPANY_SEARCH_LETTER_PATTERN = /^[A-Z]$/i;

export interface CompanySearchPage {
  companies: CompanySearchResult[];
  totalResults: number;
}

const COMPANIES_HOUSE_BASE_URL = "https://api.company-information.service.gov.uk";
const REQUEST_TIMEOUT_MS = 8_000;

export class CompanyProviderError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "CompanyProviderError";
  }
}

/**
 * Builds the `Authorization: Basic` header Companies House expects — the
 * API key is sent as the HTTP Basic username with an empty password, per
 * https://developer-specs.company-information.service.gov.uk/.
 *
 * Reads the env var lazily (not at module load) so a missing key surfaces
 * as a normal request-time CompanyProviderError instead of crashing the
 * whole route module at import time.
 */
function getAuthHeader(): string {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    throw new CompanyProviderError(
      "COMPANIES_HOUSE_API_KEY is not configured on the server.",
      500
    );
  }
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

async function companiesHouseFetch(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${COMPANIES_HOUSE_BASE_URL}${path}`, {
      headers: { Authorization: getAuthHeader(), Accept: "application/json" },
      signal: controller.signal,
      // Search results change too often (and are keyed by free-text query)
      // to be worth Next's data cache.
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof CompanyProviderError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CompanyProviderError("Companies House request timed out.", 504);
    }
    throw new CompanyProviderError(
      `Companies House request failed: ${error instanceof Error ? error.message : String(error)}`,
      502
    );
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401 || res.status === 403) {
    throw new CompanyProviderError(
      `Companies House rejected the API key (status ${res.status}).`,
      502
    );
  }
  if (res.status === 429) {
    throw new CompanyProviderError("Companies House rate limit exceeded.", 429);
  }
  if (!res.ok) {
    throw new CompanyProviderError(
      `Companies House returned status ${res.status}.`,
      res.status === 400 ? 400 : 502
    );
  }

  try {
    return await res.json();
  } catch (error) {
    throw new CompanyProviderError(
      `Failed to parse Companies House response: ${error instanceof Error ? error.message : String(error)}`,
      502
    );
  }
}

// The API returns loosely-typed JSON; these shapes cover the fields we use
// from the "Search companies" and "Get company profile" endpoints.
// https://developer-specs.company-information.service.gov.uk/
interface CompaniesHouseAddress {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

interface CompaniesHouseSearchItem {
  // The search endpoint's field for the matched name is `title`; some
  // Companies House responses (and older API versions) use `company_name`
  // instead, so both are checked when mapping a result.
  title?: string;
  company_name?: string;
  company_number?: string;
  company_status?: string;
  company_type?: string;
  date_of_creation?: string;
  address?: CompaniesHouseAddress;
  address_snippet?: string;
}

interface CompaniesHouseSearchResponse {
  items?: CompaniesHouseSearchItem[];
  total_results?: number;
}

interface CompaniesHouseProfileResponse {
  company_status?: string;
  sic_codes?: string[];
}

function normalizeAddress(address: CompaniesHouseAddress | undefined) {
  if (!address) return undefined;
  const { address_line_1, address_line_2, locality, region, postal_code, country } = address;
  if (!address_line_1 && !address_line_2 && !locality && !region && !postal_code && !country) {
    return undefined;
  }
  return {
    addressLine1: address_line_1,
    addressLine2: address_line_2,
    locality,
    region,
    postalCode: postal_code,
    country,
  };
}

function formatLocation(item: CompaniesHouseSearchItem): string | undefined {
  const parts = [item.address?.locality, item.address?.postal_code].filter(
    (part): part is string => Boolean(part)
  );
  if (parts.length > 0) return parts.join(", ");
  return item.address_snippet || undefined;
}

function normalize(item: CompaniesHouseSearchItem): CompanySearchResult | null {
  const name = item.title ?? item.company_name;
  const companyNumber = item.company_number;
  if (!name || !companyNumber) return null;

  return {
    id: companyNumber,
    name,
    companyNumber,
    status: item.company_status,
    type: item.company_type,
    dateOfCreation: item.date_of_creation,
    address: normalizeAddress(item.address),
    location: formatLocation(item),
    source: "companies-house",
  };
}

export async function searchCompanies(query: string, startIndex = 0): Promise<CompanySearchPage> {
  const params = new URLSearchParams({
    q: query,
    items_per_page: String(COMPANY_SEARCH_RESULT_LIMIT),
    start_index: String(startIndex),
  });

  const data = (await companiesHouseFetch(
    `/search/companies?${params.toString()}`
  )) as CompaniesHouseSearchResponse;

  const items = Array.isArray(data.items) ? data.items : [];
  const companies = items
    .map(normalize)
    .filter((company): company is CompanySearchResult => company !== null);

  return { companies, totalResults: data.total_results ?? companies.length };
}

const COMPANY_NUMBER_PATTERN = /^[A-Z0-9]{1,10}$/i;

/**
 * Fetches a single company's profile (status + SIC codes) so the UI can
 * enrich a selection with industry/status details.
 */
export async function fetchCompanyProfile(companyNumber: string): Promise<{
  status?: string;
  sicCodes?: string[];
}> {
  if (!COMPANY_NUMBER_PATTERN.test(companyNumber)) {
    throw new CompanyProviderError("Invalid company number.", 400);
  }

  const data = (await companiesHouseFetch(
    `/company/${encodeURIComponent(companyNumber)}`
  )) as CompaniesHouseProfileResponse;

  return { status: data.company_status, sicCodes: data.sic_codes ?? [] };
}
