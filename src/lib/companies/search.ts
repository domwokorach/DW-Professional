import type { CompanySearchResult } from "@/types/company";

const COMPANIES_HOUSE_SEARCH_URL = "https://api.company-information.service.gov.uk/search/companies";

export const COMPANY_SEARCH_MIN_QUERY_LENGTH = 2;
export const COMPANY_SEARCH_MAX_QUERY_LENGTH = 160;
export const COMPANY_SEARCH_RESULT_LIMIT = 8;

interface CompaniesHouseSearchItem {
  title?: string;
  company_number?: string;
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
    location: formatLocation(item),
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
