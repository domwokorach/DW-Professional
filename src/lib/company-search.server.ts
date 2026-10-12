// Server-only: the Company field's autocomplete. Combines the live Companies House search with the indexed company
// database (imported CSV plus companies verified live before), so results are authoritative when Companies House
// answers and still useful, honestly labelled, when it does not. Neither source is read per keystroke from S3.
import {
  COMPANY_RESULTS_MAX, companySearchKey, formatAddress, formatCompanyStatus, normaliseCompanyNumber, type CompanySummary,
} from '@/lib/companies';
import { companiesHouseEnabled, getCompanyProfile, searchCompaniesLive, type LiveSearchHit } from '@/lib/companies-house.server';
import { getCompanyPrisma, searchCompanies } from '@/lib/company-db.server';

export type CombinedSearch = {
  companies: CompanySummary[];
  /** Live Companies House results are included (false: saved records only). */
  liveAvailable: boolean;
  /** At least one source answered. When false the caller should report the service as unavailable. */
  answered: boolean;
};

const liveSummary = (h: LiveSearchHit): CompanySummary => ({
  companyNumber: h.companyNumber,
  companyName: h.companyName,
  companyStatus: formatCompanyStatus(h.status),
  companyType: h.companyType,
  address: h.addressSnippet,
  locality: h.locality ? formatAddress([h.locality]) : null,
  source: 'live',
});

/** Match strength of a name against the query, lower is better: exact, starts with, a word starts with, other. */
export function matchTier(c: CompanySummary, queryKey: string, number: string | null): number {
  if (number && c.companyNumber === number) return 0;
  const key = companySearchKey(c.companyName);
  if (key === queryKey) return 1;
  if (key.startsWith(queryKey)) return 2;
  if (key.includes(` ${queryKey}`)) return 3;
  return 4;
}

/**
 * Merges live and saved results into at most `limit` companies. A company in both appears once, with the live details
 * (they are newer). Order: match strength first (exact number or name, then prefix, then word), then active before
 * inactive, then live before saved, then each source's own relevance order.
 */
export function mergeResults(live: CompanySummary[], saved: CompanySummary[], query: string, limit = COMPANY_RESULTS_MAX): CompanySummary[] {
  const queryKey = companySearchKey(query);
  const number = normaliseCompanyNumber(query);
  const byNumber = new Map<string, { c: CompanySummary; order: number }>();
  [...live, ...saved].forEach((c, order) => { if (!byNumber.has(c.companyNumber)) byNumber.set(c.companyNumber, { c, order }); });
  return [...byNumber.values()]
    .sort((a, b) => {
      const tier = matchTier(a.c, queryKey, number) - matchTier(b.c, queryKey, number);
      if (tier) return tier;
      const active = Number(b.c.companyStatus === 'Active') - Number(a.c.companyStatus === 'Active');
      if (active) return active;
      const src = Number(b.c.source === 'live') - Number(a.c.source === 'live');
      return src || a.order - b.order;
    })
    .slice(0, limit)
    .map(({ c }) => c);
}

const errorCode = (err: unknown) => (err as { code?: string }).code ?? (err as Error).name;

/** `query` is already cleaned (cleanQuery). Never throws. */
export async function searchCompaniesCombined(query: string, limit = COMPANY_RESULTS_MAX): Promise<CombinedSearch> {
  const number = normaliseCompanyNumber(query);
  const queryKey = companySearchKey(query);
  const prisma = getCompanyPrisma();

  const liveTask = async (): Promise<CompanySummary[] | null> => {
    if (!companiesHouseEnabled()) return null;
    if (number) {
      // A company number: ask for that exact profile (reliable for numbers; the search endpoint is built for names).
      const profile = await getCompanyProfile(number);
      if (profile === 'not_found') return [];
      if (profile === 'unavailable') return null;
      const p = profile.profile;
      return [{ ...liveSummary({ companyNumber: p.companyNumber, companyName: p.companyName, status: p.status, companyType: p.companyType, addressSnippet: null, locality: p.postTown, postcode: p.postcode }), address: formatAddress([p.addressLine1, p.addressLine2, p.postTown], p.postcode) }];
    }
    const res = await searchCompaniesLive(query, queryKey, limit);
    return res === 'unavailable' ? null : res.hits.map(liveSummary);
  };
  const savedTask = async (): Promise<CompanySummary[] | null> => {
    if (!prisma) return null;
    try {
      return await searchCompanies(prisma, query, limit);
    } catch (err) {
      console.error('[companies] Search failed:', errorCode(err));
      return null;
    }
  };

  const [live, saved] = await Promise.all([liveTask(), savedTask()]);
  return {
    companies: mergeResults(live ?? [], saved ?? [], query, limit),
    liveAvailable: live !== null,
    answered: live !== null || saved !== null,
  };
}
