import { db } from "@/lib/database/db";
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

interface CompanyRecordRow {
  companyNumber: string;
  name: string;
  status: string | null;
  category: string | null;
  incorporationDate: Date | null;
  addressLine1: string | null;
  addressLine2: string | null;
  locality: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  sicCodes: string[];
}

function normalizeAddress(row: CompanyRecordRow) {
  const { addressLine1, addressLine2, locality, region, postalCode, country } = row;
  if (!addressLine1 && !addressLine2 && !locality && !region && !postalCode && !country) {
    return undefined;
  }
  return {
    addressLine1: addressLine1 ?? undefined,
    addressLine2: addressLine2 ?? undefined,
    locality: locality ?? undefined,
    region: region ?? undefined,
    postalCode: postalCode ?? undefined,
    country: country ?? undefined,
  };
}

function formatLocation(row: CompanyRecordRow): string | undefined {
  const parts = [row.locality, row.postalCode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

function normalize(row: CompanyRecordRow): CompanySearchResult {
  return {
    id: row.companyNumber,
    name: row.name,
    companyNumber: row.companyNumber,
    status: row.status ?? undefined,
    type: row.category ?? undefined,
    dateOfCreation: row.incorporationDate?.toISOString().slice(0, 10),
    address: normalizeAddress(row),
    location: formatLocation(row),
    sicCodes: row.sicCodes,
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
 * Searches the local CompanyRecord table — a mirror of Companies House's
 * free "Basic Company Data" bulk CSV export, imported via
 * scripts/import-companies-house-csv.mjs — instead of calling the Companies
 * House REST API. No API key, no rate limit from an upstream provider, no
 * network dependency at request time.
 */
export async function searchCompanies(query: string, startIndex = 0): Promise<CompanySearchPage> {
  const isLetterBrowse = COMPANY_SEARCH_LETTER_PATTERN.test(query);

  const where = {
    status: "active",
    name: isLetterBrowse ? { startsWith: query, mode: "insensitive" as const } : { contains: query, mode: "insensitive" as const },
  };

  try {
    const [rows, totalResults] = await Promise.all([
      db.companyRecord.findMany({
        where,
        orderBy: { name: "asc" },
        skip: startIndex,
        take: COMPANY_SEARCH_RESULT_LIMIT,
      }),
      db.companyRecord.count({ where }),
    ]);

    return { companies: rows.map(normalize), totalResults };
  } catch (error) {
    throw new CompanyProviderError(
      error instanceof Error ? error.message : "Company search query failed.",
      502
    );
  }
}

const COMPANY_NUMBER_PATTERN = /^[A-Z0-9]{1,10}$/i;

/**
 * Fetches a single company's profile (status + SIC codes) from the local
 * table so the UI can enrich a selection with industry/status details.
 */
export async function fetchCompanyProfile(companyNumber: string): Promise<{
  status?: string;
  sicCodes?: string[];
}> {
  if (!COMPANY_NUMBER_PATTERN.test(companyNumber)) {
    throw new CompanyProviderError("Invalid company number.", 400);
  }

  try {
    const row = await db.companyRecord.findUnique({ where: { companyNumber } });
    if (!row) return {};
    return { status: row.status ?? undefined, sicCodes: row.sicCodes };
  } catch (error) {
    throw new CompanyProviderError(
      error instanceof Error ? error.message : "Company profile query failed.",
      502
    );
  }
}
