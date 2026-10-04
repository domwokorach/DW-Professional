// Server-only: the optional company dataset's database access. Uses COMPANY_DATABASE_URL, never the
// portfolio's own DATABASE_URL, and its own generated client (generated/company), so the two
// databases can't be mixed up. Nothing here reaches the browser bundle.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/company/client';
import type { CompanyRow } from '@/lib/company-csv';

/** Feature switches. Missing configuration disables the feature quietly; it never throws. */
export const companyDatasetConfigured = () => Boolean(process.env.AWS_REGION && process.env.AWS_S3_BUCKET && process.env.AWS_S3_KEY);
export const companyDatabaseEnabled = () => Boolean(process.env.COMPANY_DATABASE_URL);

/** Keep in sync with prisma.company.config.ts. Validated, because it is used as an SQL identifier below. */
function schemaName() {
  const s = process.env.COMPANY_DATABASE_SCHEMA || 'companies';
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(s)) throw new Error('COMPANY_DATABASE_SCHEMA is not a valid schema name');
  return s;
}

const globalForCompany = globalThis as unknown as { companyPrisma?: PrismaClient };

/** One shared client per server process (kept on globalThis so dev hot reloads don't open new pools). */
export function getCompanyPrisma(): PrismaClient | null {
  const connectionString = process.env.COMPANY_DATABASE_URL;
  if (!connectionString) return null;
  globalForCompany.companyPrisma ??= new PrismaClient({ adapter: new PrismaPg({ connectionString }, { schema: schemaName() }) });
  return globalForCompany.companyPrisma;
}

/**
 * Inserts or updates companies keyed on company number: re-running an import never duplicates a
 * company. One statement per batch (unnest of parallel arrays) instead of a query per row, which is
 * what makes multi-million-row imports practical. Values are bound parameters; only the validated
 * schema name is interpolated. Duplicate numbers inside one batch are collapsed first (Postgres
 * rejects a batch that touches the same row twice).
 */
export async function upsertCompanies(prisma: PrismaClient, rows: CompanyRow[]) {
  const unique = [...new Map(rows.map((r) => [r.companyNumber, r])).values()];
  if (!unique.length) return 0;
  const col = (pick: (r: CompanyRow) => string) => unique.map(pick);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${schemaName()}"."Company"
       ("companyNumber","companyName","nameSearch","status","companyType","incorporationDate","postTown","postcode","sicText","updatedAt")
     SELECT n, name, ns, NULLIF(st,''), NULLIF(ct,''), NULLIF(d,'')::date, NULLIF(pt,''), NULLIF(pc,''), NULLIF(sic,''), now()
     FROM unnest($1::text[],$2::text[],$3::text[],$4::text[],$5::text[],$6::text[],$7::text[],$8::text[],$9::text[])
       AS t(n,name,ns,st,ct,d,pt,pc,sic)
     ON CONFLICT ("companyNumber") DO UPDATE SET
       "companyName" = EXCLUDED."companyName", "nameSearch" = EXCLUDED."nameSearch", "status" = EXCLUDED."status",
       "companyType" = EXCLUDED."companyType", "incorporationDate" = EXCLUDED."incorporationDate",
       "postTown" = EXCLUDED."postTown", "postcode" = EXCLUDED."postcode", "sicText" = EXCLUDED."sicText", "updatedAt" = now()`,
    col((r) => r.companyNumber), col((r) => r.companyName), col((r) => r.nameSearch), col((r) => r.status), col((r) => r.companyType),
    col((r) => r.incorporationDate), col((r) => r.postTown), col((r) => r.postcode), col((r) => r.sicText),
  );
  return unique.length;
}

// ---- Search -------------------------------------------------------------------------------

export const SEARCH_MIN = 2;
export const SEARCH_MAX = 60;
export const PAGE_SIZE_MAX = 20;
export const PAGE_MAX = 50;
/** Letters, digits, spaces and the punctuation found in company names. No wildcards or quotes that mean anything to SQL. */
const SEARCH_ALLOWED = /^[\p{L}\p{N} &'.,()/+!-]+$/u;

export type CompanyHit = { companyNumber: string; companyName: string; status: string | null; companyType: string | null };

/** Returns the cleaned query, or null if it is too short, too long or has unexpected characters. */
export function cleanQuery(raw: string): string | null {
  const q = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  return q.length >= SEARCH_MIN && q.length <= SEARCH_MAX && SEARCH_ALLOWED.test(q) ? q : null;
}

/** A query that looks like a company number (digits, zero-padded to 8, or two letters + digits) → exact match. */
function numberCandidate(q: string): string | null {
  if (/^\d{1,8}$/.test(q)) return q.padStart(8, '0');
  if (/^[A-Za-z]{2}\d{1,6}$/.test(q)) return `${q.slice(0, 2)}${q.slice(2).padStart(6, '0')}`.toUpperCase();
  return null;
}

/**
 * Company number (exact, so it uses the primary key) or name prefix (uses the text_pattern_ops
 * index). Prefix rather than substring matching is deliberate: it stays fast on millions of rows.
 * Returns at most `limit` rows plus whether more exist, and only the fields the UI needs.
 */
export async function searchCompanies(prisma: PrismaClient, q: string, page: number, limit: number) {
  const number = numberCandidate(q);
  const rows = await prisma.company.findMany({
    where: { OR: [...(number ? [{ companyNumber: number }] : []), { nameSearch: { startsWith: q.toLowerCase() } }] },
    select: { companyNumber: true, companyName: true, status: true, companyType: true },
    orderBy: [{ nameSearch: 'asc' }, { companyNumber: 'asc' }],
    skip: (page - 1) * limit,
    take: limit + 1,
  });
  return { results: rows.slice(0, limit) as CompanyHit[], hasMore: rows.length > limit };
}
