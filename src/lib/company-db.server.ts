// Server-only: the optional company dataset's database access. Uses COMPANY_DATABASE_URL, never the
// portfolio's own DATABASE_URL, and its own generated client (generated/company), so the two
// databases can't be mixed up. Nothing here reaches the browser bundle.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/company/client';
import type { CompanyRow } from '@/lib/company-csv';
import {
  COMPANY_RESULTS_MAX,
  COMPANY_SEARCH_MAX,
  COMPANY_SEARCH_MIN,
  companySearchKey,
  formatAddress,
  formatCompanyStatus,
  normaliseCompanyNumber,
  type CompanySummary,
} from '@/lib/companies';

/** Feature switches. Missing configuration disables the feature quietly; it never throws. */
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
 * company, and a newer dataset updates the rows it contains. One statement per batch (unnest of
 * parallel arrays) instead of a query per row, which is what makes multi-million-row imports
 * practical. Values are bound parameters; only the validated schema name is interpolated. Duplicate
 * numbers inside one batch are collapsed first (Postgres rejects a batch that touches the same row twice).
 */
export async function upsertCompanies(prisma: PrismaClient, rows: CompanyRow[]) {
  const unique = [...new Map(rows.map((r) => [r.companyNumber, r])).values()];
  if (!unique.length) return 0;
  const cols = [
    'companyNumber', 'companyName', 'nameSearch', 'status', 'companyType', 'incorporationDate', 'dissolutionDate',
    'addressLine1', 'addressLine2', 'postTown', 'county', 'country', 'postcode', 'sicText', 'sicText2', 'sicText3', 'sicText4',
  ] as const satisfies readonly (keyof CompanyRow)[];
  const dates = new Set<string>(['incorporationDate', 'dissolutionDate']);
  const required = new Set<string>(['companyNumber', 'companyName', 'nameSearch']);
  const select = cols.map((c, i) => {
    const v = `v${i}`;
    if (dates.has(c)) return `NULLIF(${v},'')::date`;
    return required.has(c) ? v : `NULLIF(${v},'')`;
  });
  const quoted = cols.map((c) => `"${c}"`);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${schemaName()}"."Company" (${quoted.join(',')},"importedAt","updatedAt")
     SELECT ${select.join(',')}, now(), now()
     FROM unnest(${cols.map((_, i) => `$${i + 1}::text[]`).join(',')}) AS t(${cols.map((_, i) => `v${i}`).join(',')})
     ON CONFLICT ("companyNumber") DO UPDATE SET
       ${quoted.slice(1).map((c) => `${c} = EXCLUDED.${c}`).join(', ')}, "importedAt" = now(), "updatedAt" = now()`,
    ...cols.map((c) => unique.map((r) => r[c])),
  );
  return unique.length;
}

// ---- Search -------------------------------------------------------------------------------

/** Letters, digits, spaces and the punctuation found in company names. No wildcards or quotes that mean anything to SQL. */
const SEARCH_ALLOWED = /^[\p{L}\p{N} &'.,()/+!@-]+$/u;

/** Returns the cleaned query, or null if it is too short, too long or has unexpected characters. */
export function cleanQuery(raw: string): string | null {
  const q = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  return q.length >= COMPANY_SEARCH_MIN && q.length <= COMPANY_SEARCH_MAX && SEARCH_ALLOWED.test(q) ? q : null;
}

type CompanyDbRow = {
  companyNumber: string;
  companyName: string;
  status: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postTown: string | null;
  postcode: string | null;
};

const SUMMARY_COLUMNS = '"companyNumber","companyName","status","addressLine1","addressLine2","postTown","postcode"';

export const toSummary = (r: CompanyDbRow): CompanySummary => ({
  companyNumber: r.companyNumber,
  companyName: r.companyName,
  companyStatus: formatCompanyStatus(r.status),
  address: formatAddress([r.addressLine1, r.addressLine2, r.postTown], r.postcode),
  locality: formatAddress([r.postTown]),
});

/**
 * Where pg_trgm lives, if the trigram index exists (see migration 20261006120000_company_search).
 * Checked once per server process; without it, search uses exact and prefix matches only.
 */
let trigram: Promise<string | null> | undefined;
function trigramSchema(prisma: PrismaClient) {
  trigram ??= prisma
    .$queryRawUnsafe<{ schema: string }[]>(
      `SELECT e.extnamespace::regnamespace::text AS schema
       FROM pg_extension e
       WHERE e.extname = 'pg_trgm'
         AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = $1 AND indexname = 'Company_nameSearch_trgm_idx')`,
      schemaName(),
    )
    .then((rows) => (rows[0]?.schema ? rows[0].schema.replace(/^"|"$/g, '') : null))
    .catch(() => {
      trigram = undefined; // try again next time
      return null;
    });
  return trigram;
}

/** Escapes LIKE wildcards. cleanQuery already rejects them; this keeps the SQL safe on its own. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Words in so many company names that they say nothing about which company is meant. */
const GENERIC_WORDS = new Set(['limited', 'ltd', 'plc', 'llp', 'lp', 'cic', 'the', 'and', 'of', 'co', 'company', 'uk', 'group', 'holdings', 'services', 'l', 'p', 'c']);

/**
 * Company-name autocomplete. Candidates come only from indexed lookups (never a full-table scan):
 *   - the company number, when the query looks like one (primary key)
 *   - names starting with the query (btree, text_pattern_ops)
 *   - names with a word starting with the query, and close matches for typos ("tesko" → TESCO PLC),
 *     both from the pg_trgm GIN index when it exists
 * ranked: number, exact name, starts with, word starts with, close match. Within a tier active
 * companies come first, then closer and shorter names ("TESCO PLC" before "TESCO STORES LIMITED").
 * Close matches ignore generic words, so "tesco plc" doesn't suggest every "… PLC".
 * All values are bound parameters; only the validated schema names are interpolated.
 */
export async function searchCompanies(prisma: PrismaClient, query: string, limit = COMPANY_RESULTS_MAX): Promise<CompanySummary[]> {
  const key = companySearchKey(query);
  const number = normaliseCompanyNumber(query);
  if (!key && !number) return [];
  const s = `"${schemaName()}"."Company"`;
  const trgm = key.length >= 3 ? await trigramSchema(prisma) : null;
  const t = trgm ? `"${trgm}"` : null;
  const fuzzyKey = key.split(' ').filter((w) => !GENERIC_WORDS.has(w)).join(' ');

  const params: unknown[] = [key, `${likeEscape(key)}%`, `% ${likeEscape(key)}%`, Math.min(limit, COMPANY_RESULTS_MAX), number ?? ''];
  const branches = [
    `(SELECT ${SUMMARY_COLUMNS}, "nameSearch" FROM ${s} WHERE "companyNumber" = $5)`,
    `(SELECT ${SUMMARY_COLUMNS}, "nameSearch" FROM ${s} WHERE "nameSearch" LIKE $2 ORDER BY "nameSearch" LIMIT 1000)`,
  ];
  const order = [
    `CASE WHEN c."companyNumber" = $5 THEN 0
          WHEN c."nameSearch" = $1 THEN 1
          WHEN c."nameSearch" LIKE $2 THEN 2
          WHEN c."nameSearch" LIKE $3 THEN 3
          ELSE 4 END`,
    `(lower(c."status") = 'active') DESC`,
  ];
  if (t) {
    branches.push(`(SELECT ${SUMMARY_COLUMNS}, "nameSearch" FROM ${s} WHERE "nameSearch" LIKE $3 LIMIT 300)`);
    // Close matches need a distinctive word of 4+ letters: shorter ones match too many names to help.
    if (fuzzyKey.length >= 4) {
      params.push(fuzzyKey);
      branches.push(`(SELECT ${SUMMARY_COLUMNS}, "nameSearch" FROM ${s} WHERE $6 OPERATOR(${t}.<%) "nameSearch" LIMIT 300)`);
      order.push(`${t}.word_similarity($6, c."nameSearch") DESC`);
    }
  }
  order.push('length(c."nameSearch")', 'c."nameSearch"');

  const sql = `
    SELECT ${SUMMARY_COLUMNS.split(',').map((c) => `c.${c}`).join(',')}
    FROM (${branches.join(' UNION ')}) c
    ORDER BY ${order.join(', ')}
    LIMIT $4`;

  // A slow query must not hold the Company field up: cap it, and the route treats a timeout as "unavailable".
  // Close-match threshold: 0.5 lets a one-letter typo in a short name through ("tesko"); longer
  // words have more letters to agree on, so they use pg_trgm's stricter default of 0.6.
  const threshold = fuzzyKey.length <= 6 ? '0.5' : '0.6';
  const [, , rows] = await prisma.$transaction([
    prisma.$executeRawUnsafe(`SET LOCAL statement_timeout = '2500ms'`),
    prisma.$executeRawUnsafe(t ? `SET LOCAL pg_trgm.word_similarity_threshold = ${threshold}` : 'SELECT 1'),
    prisma.$queryRawUnsafe<CompanyDbRow[]>(sql, ...params),
  ]);
  return rows.map(toSummary);
}

/** One company from the imported dataset, or null. */
export async function getCompany(prisma: PrismaClient, companyNumber: string): Promise<CompanySummary | null> {
  const row = await prisma.company.findUnique({
    where: { companyNumber },
    select: { companyNumber: true, companyName: true, status: true, addressLine1: true, addressLine2: true, postTown: true, postcode: true },
  });
  return row ? toSummary(row) : null;
}

/** Live Companies House details for a company already in the dataset: keeps search results current between imports. */
export async function refreshCompany(
  prisma: PrismaClient,
  live: { companyNumber: string; companyName: string; status: string | null; addressLine1: string | null; addressLine2: string | null; postTown: string | null; county: string | null; country: string | null; postcode: string | null },
) {
  await prisma.company.updateMany({
    where: { companyNumber: live.companyNumber },
    data: {
      companyName: live.companyName,
      nameSearch: companySearchKey(live.companyName),
      status: live.status,
      addressLine1: live.addressLine1,
      addressLine2: live.addressLine2,
      postTown: live.postTown,
      county: live.county,
      country: live.country,
      postcode: live.postcode,
    },
  });
}
