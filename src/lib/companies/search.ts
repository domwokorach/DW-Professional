import type { CompanySearchResult } from "@/types/company";

// TEMP: pointed at the Companies House sandbox host until a genuine Live
// REST application key is provisioned (the current key only works here).
const COMPANIES_HOUSE_BASE_URL = "https://api-sandbox.company-information.service.gov.uk";
const COMPANIES_HOUSE_SEARCH_URL = `${COMPANIES_HOUSE_BASE_URL}/search/companies`;

export const COMPANY_SEARCH_MIN_QUERY_LENGTH = 2;
export const COMPANY_SEARCH_MAX_QUERY_LENGTH = 160;
export const COMPANY_SEARCH_RESULT_LIMIT = 8;

interface CompaniesHouseSearchItem {
  title?: string;
  company_number?: string;
  company_status?: string;
  address_snippet?: string;
  registered_office_address?: {
    address_line_1?: string;
    locality?: string;
    postal_code?: string;
  };
}

interface CompaniesHouseSearchResponse {
  items?: CompaniesHouseSearchItem[];
}

interface CompaniesHouseProfile {
  company_status?: string;
  sic_codes?: string[];
}

function formatLocation(item: CompaniesHouseSearchItem): string | undefined {
  if (item.address_snippet) return item.address_snippet;
  const office = item.registered_office_address;
  if (!office) return undefined;
  const parts = [office.address_line_1, office.locality, office.postal_code].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

function normalize(item: CompaniesHouseSearchItem, index: number): CompanySearchResult | null {
  if (!item.title) return null;
  return {
    id: item.company_number ?? `${item.title}-${index}`,
    name: item.title,
    companyNumber: item.company_number,
    status: item.company_status,
    location: formatLocation(item),
    source: "companies-house",
  };
}

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
 * Server-side only: calls the Companies House public search API with the
 * API key as the Basic Auth username (no password) per their auth scheme,
 * and normalizes the response to just what the UI needs. Never call this
 * from the browser — COMPANIES_HOUSE_API_KEY must stay server-only.
 */
export async function searchCompanies(query: string): Promise<CompanySearchResult[]> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    throw new CompanyProviderError("Company search is not configured.", 500);
  }

  const url = new URL(COMPANIES_HOUSE_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("items_per_page", String(COMPANY_SEARCH_RESULT_LIMIT));

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    throw new CompanyProviderError(
      error instanceof Error ? error.message : "Company search request failed.",
      502
    );
  }

  if (response.status === 429) {
    throw new CompanyProviderError("Company search rate limit reached.", 429);
  }
  if (!response.ok) {
    throw new CompanyProviderError(`Company search failed with status ${response.status}.`, 502);
  }

  const data: CompaniesHouseSearchResponse = await response.json();
  const items = data.items ?? [];
  return items
    .map(normalize)
    .filter((result): result is CompanySearchResult => result !== null)
    .slice(0, COMPANY_SEARCH_RESULT_LIMIT);
}

const COMPANY_NUMBER_PATTERN = /^[A-Z0-9]{1,10}$/i;

/**
 * Server-side only: fetches a single company's profile (status + SIC codes)
 * so the UI can show the industry/status only after the candidate has
 * picked a specific company, rather than on every search result.
 */
export async function fetchCompanyProfile(companyNumber: string): Promise<{
  status?: string;
  sicCodes?: string[];
}> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    throw new CompanyProviderError("Company search is not configured.", 500);
  }
  if (!COMPANY_NUMBER_PATTERN.test(companyNumber)) {
    throw new CompanyProviderError("Invalid company number.", 400);
  }

  let response: Response;
  try {
    response = await fetch(
      `${COMPANIES_HOUSE_BASE_URL}/company/${encodeURIComponent(companyNumber)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        },
        signal: AbortSignal.timeout(5000),
      }
    );
  } catch (error) {
    throw new CompanyProviderError(
      error instanceof Error ? error.message : "Company profile request failed.",
      502
    );
  }

  if (response.status === 429) {
    throw new CompanyProviderError("Company search rate limit reached.", 429);
  }
  if (!response.ok) {
    throw new CompanyProviderError(`Company profile failed with status ${response.status}.`, 502);
  }

  const data: CompaniesHouseProfile = await response.json();
  return { status: data.company_status, sicCodes: data.sic_codes };
}
