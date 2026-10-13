// Server-only: turns the Company field of the résumé form into the details stored with the request. A company the
// visitor picked is looked up again here by its registration number, so what is stored (official name, status, address,
// source, verification time) never comes from the browser. Registration shows the company exists; it does not show
// that the visitor works there.
import { normaliseCompanyNumber } from '@/lib/companies';
import { lookupCompany } from '@/lib/company-lookup.server';

export type ResumeCompany = {
  /** The company name to store: the official name for a checked company, otherwise what was typed. */
  name: string;
  number: string | null;
  status: string | null;
  location: string | null;
  source: 'companies_house' | 'company_database' | 'manual';
  /** When Companies House confirmed it live; null otherwise. */
  verifiedAt: Date | null;
};

const manual = (name: string): ResumeCompany => ({ name, number: null, status: null, location: null, source: 'manual', verifiedAt: null });

/** `typed` is the cleaned text of the field; `rawNumber` the registration number the browser says was picked, if any. */
export async function resolveResumeCompany(typed: string, rawNumber: unknown): Promise<ResumeCompany> {
  const number = typeof rawNumber === 'string' ? normaliseCompanyNumber(rawNumber) : null;
  if (!number) return manual(typed);
  const found = await lookupCompany(number);
  // Unknown or unreachable: keep what the visitor typed, without the unchecked number.
  if (!found || found === 'not_found') return manual(typed);
  const { company, verified, verifiedAt } = found;
  return {
    name: company.companyName,
    number: company.companyNumber,
    status: company.companyStatus,
    location: company.address ?? company.locality,
    source: verified ? 'companies_house' : 'company_database',
    verifiedAt: verified ? new Date(verifiedAt ?? Date.now()) : null,
  };
}
