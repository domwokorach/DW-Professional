// Company search types and helpers shared by the browser (Company field) and the server (search,
// verification and the contact route). No secrets or server imports here.

/** What the search and verify APIs return for one company: only what the Company field shows. */
export type CompanySummary = {
  /** Always a string: company numbers are identifiers with meaningful leading zeros ("00445790"). */
  companyNumber: string;
  companyName: string;
  /** Display label, e.g. "Active", "In administration". */
  companyStatus: string | null;
  /** One-line registered office address. */
  address: string | null;
  /** Town or city, for the short location shown in results. */
  locality: string | null;
};

export type CompanySearchResponse = { companies: CompanySummary[] };
export type CompanyVerifyResponse = {
  company: CompanySummary;
  /** True when the details came from Companies House just now; false when they are from the imported dataset. */
  verified: boolean;
};

export const COMPANY_SEARCH_MIN = 2;
export const COMPANY_SEARCH_MAX = 60;
export const COMPANY_RESULTS_MAX = 10;

/** Companies House numbers are 8 characters: digits, or a prefix such as SC, NI, OC or R0 plus digits (a few end in a letter). */
const COMPANY_NUMBER = /^[A-Z0-9]{8}$/;

/** Upper-cases and zero-pads a typed number ("445790" → "00445790", "sc95000" → "SC095000"); null if it can't be one. */
export function normaliseCompanyNumber(raw: string): string | null {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (/^\d{1,8}$/.test(v)) return v.padStart(8, '0');
  const prefixed = /^([A-Z]{2})(\d{1,6})$/.exec(v);
  if (prefixed) return `${prefixed[1]}${prefixed[2].padStart(6, '0')}`;
  return COMPANY_NUMBER.test(v) ? v : null;
}

export const isCompanyNumber = (v: string) => COMPANY_NUMBER.test(v);

/**
 * Search key for company names, used for both the stored column and the visitor's query so they
 * always compare like for like: accents and case folded, "&" read as "and", other punctuation
 * treated as a space, whitespace collapsed. "J. Sainsbury plc" and "j sainsbury PLC" both become
 * "j sainsbury plc"; "Marks & Spencer" becomes "marks and spencer".
 */
export function companySearchKey(name: string) {
  return name
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Companies House status codes (live API) and dataset labels (CSV) → one display label. */
const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  dissolved: 'Dissolved',
  liquidation: 'Liquidation',
  receivership: 'Receivership',
  administration: 'In administration',
  'in administration': 'In administration',
  'voluntary-arrangement': 'Voluntary arrangement',
  'voluntary arrangement': 'Voluntary arrangement',
  'converted-closed': 'Converted / closed',
  'insolvency-proceedings': 'Insolvency proceedings',
  'active - proposal to strike off': 'Proposal to strike off',
  registered: 'Registered',
  removed: 'Removed',
  closed: 'Closed',
  open: 'Open',
};

export function formatCompanyStatus(raw: string | null | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  const known = STATUS_LABELS[v.toLowerCase()];
  if (known) return known;
  const words = v.replace(/[-_]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "TESCO HOUSE, SHIRE PARK" style upper-case address parts → "Tesco House, Shire Park"; postcodes stay upper case. */
export function formatAddress(parts: (string | null | undefined)[], postcode?: string | null) {
  const title = (s: string) => s.toLowerCase().replace(/(^|[\s\-'(/])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
  const lines = parts.map((p) => p?.trim()).filter((p): p is string => Boolean(p)).map(title);
  const pc = postcode?.trim().toUpperCase();
  return [...lines, ...(pc ? [pc] : [])].join(', ') || null;
}

/** Public Companies House page for a company (used in the enquiry email). */
export const companiesHouseUrl = (companyNumber: string) =>
  `https://find-and-update.company-information.service.gov.uk/company/${encodeURIComponent(companyNumber)}`;
