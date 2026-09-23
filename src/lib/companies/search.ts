import type { Prisma, CompanyRecord } from "@prisma/client";
import { db } from "@/lib/database/db";
import type { CompanySearchResult } from "@/types/company";
import type { ParsedCompanyRow } from "@/lib/companies/csv-import";

export const COMPANY_SEARCH_MIN_QUERY_LENGTH = 2;
export const COMPANY_SEARCH_MAX_QUERY_LENGTH = 160;
// "Return no more than 10 results per request."
export const COMPANY_SEARCH_RESULT_LIMIT = 10;

// A single A–Z browse letter is a valid query on its own even though it's
// shorter than COMPANY_SEARCH_MIN_QUERY_LENGTH — see the A–Z filter in
// CompanySearchField.
export const COMPANY_SEARCH_LETTER_PATTERN = /^[A-Z]$/i;

export interface CompanySearchPage {
  companies: CompanySearchResult[];
  totalResults: number;
  /**
   * Only set (and only ever `true`) when a search comes back with no
   * matches — distinguishes "the whole CompanyRecord table is empty" (an
   * import never ran / needs re-running) from an ordinary no-match search,
   * so the UI can tell candidates apart from an operator-facing outage.
   */
  datasetEmpty?: boolean;
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

// Rows imported from a generic CSV (see csv-import.ts) may not carry a real
// company number. CompanyRecord.companyNumber is a required unique column,
// so those rows get a synthetic placeholder instead of a null — this prefix
// marks it as synthetic so it's never shown to users as a real company
// number (see mapRecord below).
const SYNTHETIC_NUMBER_PREFIX = "no-number:";

function syntheticCompanyNumber(name: string): string {
  const slug = name.trim().toLowerCase().replace(/\s+/g, " ");
  const unique = Math.random().toString(36).slice(2, 8);
  return `${SYNTHETIC_NUMBER_PREFIX}${slug}#${unique}`;
}

/** Lowercased, whitespace-collapsed — mirrors CompanyRecord.nameNormalized. */
export function normalizeCompanyName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Lowercased, space-stripped — mirrors CompanyRecord.postcodeNormalized, so "SW1A 2AA" and "sw1a2aa" match the same row. */
export function normalizePostcode(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

// UK company numbers are up to 8 alphanumeric characters (Scottish/NI
// prefixes use 2 letters + 6 digits); allow a little slack either side.
const COMPANY_NUMBER_PATTERN = /^[A-Z0-9]{1,10}$/i;

function normalizeAddress(record: CompanyRecord) {
  const { addressLine1, addressLine2, locality, region, postalCode, country } = record;
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

function formatLocation(record: CompanyRecord): string | undefined {
  const parts = [record.locality, record.postalCode].filter((part): part is string => Boolean(part));
  if (parts.length > 0) return parts.join(", ");
  return record.addressLine1 ?? undefined;
}

function mapRecord(record: CompanyRecord): CompanySearchResult {
  const isSynthetic = record.companyNumber.startsWith(SYNTHETIC_NUMBER_PREFIX);
  return {
    id: record.id,
    name: record.name,
    companyNumber: isSynthetic ? undefined : record.companyNumber,
    status: record.status ?? undefined,
    type: record.category ?? undefined,
    dateOfCreation: record.incorporationDate ? record.incorporationDate.toISOString() : undefined,
    address: normalizeAddress(record),
    postcode: record.postalCode ?? undefined,
    location: formatLocation(record),
    sicCodes: record.sicCodes,
    source: "companies-house",
  };
}

/**
 * Searches the local CompanyRecord table (populated from an imported CSV —
 * see csv-import.ts, scripts/import-companies-house-csv.mjs and
 * /api/admin/companies/import) instead of calling any external provider —
 * the whole dataset lives in Postgres and is never shipped to the browser.
 *
 * Case-insensitive; a postcode matches with or without spaces. Results are
 * assembled tier by tier in priority order and capped at
 * COMPANY_SEARCH_RESULT_LIMIT total:
 *   1. exact company-number match
 *   2. exact company-name match
 *   3. company-name prefix match
 *   4. exact postcode match
 *   5. fuzzy (substring) company-name match
 */
export async function searchCompanies(query: string): Promise<CompanySearchPage> {
  const term = query.trim();
  if (!term) return { companies: [], totalResults: 0 };

  const nameTerm = normalizeCompanyName(term);
  const postcodeTerm = normalizePostcode(term);

  const seen = new Set<string>();
  const companies: CompanyRecord[] = [];

  async function addTier(where: Prisma.CompanyRecordWhereInput) {
    const remaining = COMPANY_SEARCH_RESULT_LIMIT - companies.length;
    if (remaining <= 0) return;
    const rows = await db.companyRecord.findMany({
      where,
      orderBy: { name: "asc" },
      take: remaining + seen.size, // over-fetch a little to cover ids we've already placed
    });
    for (const row of rows) {
      if (companies.length >= COMPANY_SEARCH_RESULT_LIMIT) break;
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      companies.push(row);
    }
  }

  // 1. Exact company-number match.
  if (COMPANY_NUMBER_PATTERN.test(term.replace(/\s+/g, ""))) {
    await addTier({ companyNumber: { equals: term.replace(/\s+/g, ""), mode: "insensitive" } });
  }

  // 2 & 3. Exact company-name match, then name-prefix match.
  await addTier({ nameNormalized: nameTerm });
  await addTier({ nameNormalized: { startsWith: nameTerm }, NOT: { nameNormalized: nameTerm } });

  // 4. Exact postcode match.
  if (postcodeTerm) {
    await addTier({ postcodeNormalized: postcodeTerm });
  }

  // 5. Fuzzy (substring) company-name match.
  await addTier({ nameNormalized: { contains: nameTerm } });

  if (companies.length === 0 && (await countCompanyRecords()) === 0) {
    return { companies: [], totalResults: 0, datasetEmpty: true };
  }

  return { companies: companies.map(mapRecord), totalResults: companies.length };
}

/**
 * Looks up a single company's status + SIC codes by number, used to enrich
 * a selection made from search results.
 */
export async function fetchCompanyProfile(companyNumber: string): Promise<{
  status?: string;
  sicCodes?: string[];
}> {
  if (!COMPANY_NUMBER_PATTERN.test(companyNumber)) {
    throw new CompanyProviderError("Invalid company number.", 400);
  }

  const record = await db.companyRecord.findUnique({ where: { companyNumber } });
  if (!record) {
    throw new CompanyProviderError("Company not found.", 404);
  }

  return { status: record.status ?? undefined, sicCodes: record.sicCodes };
}

const REPLACE_BATCH_SIZE = 2000;

/**
 * Replaces the entire CompanyRecord table with freshly-parsed CSV rows,
 * used by the admin CSV re-import/replacement action. Runs as a single
 * transaction so search never sees a half-imported dataset.
 *
 * (The much larger monthly Companies House bulk-file import goes through
 * scripts/import-companies-house-csv.mjs instead, which streams and
 * generation-swaps rather than holding everything in one transaction.)
 */
export async function replaceCompanyRecords(rows: ParsedCompanyRow[]): Promise<{ inserted: number }> {
  await db.$transaction(async (tx) => {
    await tx.companyRecord.deleteMany({});

    for (let i = 0; i < rows.length; i += REPLACE_BATCH_SIZE) {
      const batch = rows.slice(i, i + REPLACE_BATCH_SIZE).map((row) => ({
        companyNumber: row.companyNumber ?? syntheticCompanyNumber(row.name),
        name: row.name,
        nameNormalized: normalizeCompanyName(row.name),
        status: row.status,
        category: row.category,
        addressLine1: row.address,
        addressLine2: row.addressLine2,
        locality: row.locality,
        region: row.region,
        postalCode: row.postcode,
        postcodeNormalized: row.postcode ? normalizePostcode(row.postcode) : undefined,
        country: row.country,
        uri: row.uri,
      }));
      await tx.companyRecord.createMany({ data: batch });
    }
  });

  return { inserted: rows.length };
}

export async function countCompanyRecords(): Promise<number> {
  return db.companyRecord.count();
}
