import type { Prisma, CompanyRecord } from "@prisma/client";
import { db } from "@/lib/database/db";
import type { CompanySearchResult } from "@/types/company";
import type { ParsedCompanyRow } from "@/lib/companies/csv-import";

export const COMPANY_SEARCH_MIN_QUERY_LENGTH = 2;
export const COMPANY_SEARCH_MAX_QUERY_LENGTH = 160;
export const COMPANY_SEARCH_RESULT_LIMIT = 20;

// A single A–Z browse letter is a valid query on its own even though it's
// shorter than COMPANY_SEARCH_MIN_QUERY_LENGTH — see the A–Z filter in
// CompanySearchField.
export const COMPANY_SEARCH_LETTER_PATTERN = /^[A-Z]$/i;

export interface CompanySearchPage {
  companies: CompanySearchResult[];
  totalResults: number;
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
    location: formatLocation(record),
    sicCodes: record.sicCodes,
    source: "companies-house",
  };
}

/**
 * Searches the local CompanyRecord table (populated from an imported CSV —
 * see csv-import.ts and /api/admin/companies/import) instead of calling any
 * external provider. Case-insensitive; names starting with the query rank
 * above names that only contain it elsewhere.
 */
export async function searchCompanies(query: string, startIndex = 0): Promise<CompanySearchPage> {
  const term = query.trim();
  if (!term) return { companies: [], totalResults: 0 };

  const containsWhere: Prisma.CompanyRecordWhereInput = {
    name: { contains: term, mode: "insensitive" },
  };

  if (startIndex > 0) {
    // Pagination past the first page doesn't need startsWith-priority
    // ranking — a stable name-ordered scan is enough for "load more".
    const [companies, totalResults] = await Promise.all([
      db.companyRecord.findMany({
        where: containsWhere,
        orderBy: { name: "asc" },
        skip: startIndex,
        take: COMPANY_SEARCH_RESULT_LIMIT,
      }),
      db.companyRecord.count({ where: containsWhere }),
    ]);
    return { companies: companies.map(mapRecord), totalResults };
  }

  const startsWithWhere: Prisma.CompanyRecordWhereInput = {
    name: { startsWith: term, mode: "insensitive" },
  };

  const [startsWith, totalResults] = await Promise.all([
    db.companyRecord.findMany({
      where: startsWithWhere,
      orderBy: { name: "asc" },
      take: COMPANY_SEARCH_RESULT_LIMIT,
    }),
    db.companyRecord.count({ where: containsWhere }),
  ]);

  let companies = startsWith;
  if (companies.length < COMPANY_SEARCH_RESULT_LIMIT) {
    const remainder = await db.companyRecord.findMany({
      where: {
        AND: [containsWhere, { NOT: startsWithWhere }],
      },
      orderBy: { name: "asc" },
      take: COMPANY_SEARCH_RESULT_LIMIT - companies.length,
    });
    companies = [...companies, ...remainder];
  }

  return { companies: companies.map(mapRecord), totalResults };
}

const COMPANY_NUMBER_PATTERN = /^[A-Z0-9]{1,10}$/i;

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
 */
export async function replaceCompanyRecords(rows: ParsedCompanyRow[]): Promise<{ inserted: number }> {
  await db.$transaction(async (tx) => {
    await tx.companyRecord.deleteMany({});

    for (let i = 0; i < rows.length; i += REPLACE_BATCH_SIZE) {
      const batch = rows.slice(i, i + REPLACE_BATCH_SIZE).map((row) => ({
        companyNumber: row.companyNumber ?? syntheticCompanyNumber(row.name),
        name: row.name,
        status: row.status,
        addressLine1: row.address,
      }));
      await tx.companyRecord.createMany({ data: batch });
    }
  });

  return { inserted: rows.length };
}

export async function countCompanyRecords(): Promise<number> {
  return db.companyRecord.count();
}
