// Server-only: one company's details for the Company field and the contact route. Companies House
// (live) first, falling back to the imported dataset, so a selection survives an API outage.
import { formatAddress, formatCompanyStatus, type CompanySummary } from '@/lib/companies';
import { companiesHouseEnabled, getCompanyProfile, type CompanyProfile } from '@/lib/companies-house.server';
import { getCompany, getCompanyPrisma, refreshCompany } from '@/lib/company-db.server';

const profileSummary = (p: CompanyProfile): CompanySummary => ({
  companyNumber: p.companyNumber,
  companyName: p.companyName,
  companyStatus: formatCompanyStatus(p.status),
  companyType: p.companyType,
  address: formatAddress([p.addressLine1, p.addressLine2, p.postTown], p.postcode),
  locality: formatAddress([p.postTown]),
});

const errorCode = (err: unknown) => (err as { code?: string }).code ?? (err as Error).name;

/**
 * `{ company, verified: true }` from Companies House, `{ company, verified: false }` from the local
 * dataset when the live API is unavailable (or not configured), 'not_found' when neither knows the
 * number, or null when neither source could be asked. `companyNumber` must already be normalised.
 */
export async function lookupCompany(companyNumber: string): Promise<{ company: CompanySummary; verified: boolean } | 'not_found' | null> {
  const prisma = getCompanyPrisma();
  // local: a summary, null (the dataset has no such company), or 'error' (no dataset, or it failed).
  const [live, local] = await Promise.all([
    getCompanyProfile(companyNumber),
    prisma
      ? getCompany(prisma, companyNumber).catch((err) => {
          console.error('[companies] Lookup failed:', errorCode(err));
          return 'error' as const;
        })
      : Promise.resolve('error' as const),
  ]);

  if (typeof live === 'object') {
    // Keep the search index current with what Companies House says now. Best effort, never awaited by the visitor.
    if (prisma && local && local !== 'error') refreshCompany(prisma, live.profile).catch((err) => console.error('[companies] Refresh failed:', errorCode(err)));
    return { company: profileSummary(live.profile), verified: true };
  }
  if (local && local !== 'error') return { company: local, verified: false };
  // Not found by every source that could be asked.
  if (live === 'not_found' && local !== 'error') return 'not_found';
  if (live === 'not_found' && !prisma) return 'not_found';
  if (!companiesHouseEnabled() && local === null) return 'not_found';
  return null;
}
