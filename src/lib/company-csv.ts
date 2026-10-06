// Maps one row of the company CSV to a database row. Pure and dependency-free, so the importer and
// tests share it. Columns are matched by header name (ignoring case, spaces and punctuation), which
// tolerates the stray leading spaces in Companies House headers; a file without CompanyNumber and
// CompanyName is rejected rather than loaded wrongly.
import { companySearchKey } from '@/lib/companies';

export type CompanyRow = {
  /** Kept as text: leading zeros are part of the number ("00445790"). */
  companyNumber: string;
  companyName: string;
  nameSearch: string;
  status: string;
  companyType: string;
  /** ISO dates (yyyy-mm-dd) or empty. */
  incorporationDate: string;
  dissolutionDate: string;
  addressLine1: string;
  addressLine2: string;
  postTown: string;
  county: string;
  country: string;
  postcode: string;
  sicText: string;
  sicText2: string;
  sicText3: string;
  sicText4: string;
};

export type RowResult = { row: CompanyRow } | { skip: 'missing-number' | 'missing-name' | 'bad-number' };

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Normalised header → field (Companies House "basic company data" names). */
const FIELDS = {
  companynumber: 'companyNumber',
  companyname: 'companyName',
  companystatus: 'status',
  companycategory: 'companyType',
  incorporationdate: 'incorporationDate',
  dissolutiondate: 'dissolutionDate',
  regaddressaddressline1: 'addressLine1',
  regaddressaddressline2: 'addressLine2',
  regaddressposttown: 'postTown',
  regaddresscounty: 'county',
  regaddresscountry: 'country',
  regaddresspostcode: 'postcode',
  siccodesictext1: 'sicText',
  siccodesictext2: 'sicText2',
  siccodesictext3: 'sicText3',
  siccodesictext4: 'sicText4',
} as const;

type Field = (typeof FIELDS)[keyof typeof FIELDS];
export type HeaderMap = Partial<Record<Field, string>>;

/** Finds which CSV header supplies each field. Throws if the required columns are absent. */
export function mapHeaders(headers: string[]): HeaderMap {
  const map: HeaderMap = {};
  for (const h of headers) {
    const field = FIELDS[norm(h) as keyof typeof FIELDS];
    if (field && !map[field]) map[field] = h;
  }
  if (!map.companyNumber || !map.companyName) {
    const seen = headers.slice(0, 12).map((h) => JSON.stringify(h.trim())).join(', ');
    throw new Error(`The CSV must have CompanyNumber and CompanyName columns. Headers found: ${seen}${headers.length > 12 ? ', …' : ''}`);
  }
  return map;
}

/** dd/mm/yyyy (Companies House) or yyyy-mm-dd → yyyy-mm-dd, or '' if it isn't a real date. */
export function toIsoDate(raw: string): string {
  const v = raw.trim();
  let y: string, m: string, d: string;
  let hit = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (hit) [, d, m, y] = hit;
  else if ((hit = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v))) [, y, m, d] = hit;
  else return '';
  const date = new Date(Date.UTC(+y, +m - 1, +d));
  return date.getUTCFullYear() === +y && date.getUTCMonth() === +m - 1 && date.getUTCDate() === +d ? `${y}-${m}-${d}` : '';
}

const cell = (rec: Record<string, string>, header: string | undefined) => (header ? (rec[header] ?? '').trim().replace(/\s+/g, ' ') : '');

export function mapRow(rec: Record<string, string>, map: HeaderMap): RowResult {
  // Read as text and never converted to a number, so "00445790" keeps its leading zeros.
  const companyNumber = cell(rec, map.companyNumber).toUpperCase();
  const companyName = cell(rec, map.companyName);
  if (!companyNumber) return { skip: 'missing-number' };
  if (!companyName) return { skip: 'missing-name' };
  if (!/^[A-Z0-9]{2,10}$/.test(companyNumber)) return { skip: 'bad-number' };
  return {
    row: {
      companyNumber,
      companyName,
      nameSearch: companySearchKey(companyName),
      status: cell(rec, map.status),
      companyType: cell(rec, map.companyType),
      incorporationDate: toIsoDate(cell(rec, map.incorporationDate)),
      dissolutionDate: toIsoDate(cell(rec, map.dissolutionDate)),
      addressLine1: cell(rec, map.addressLine1),
      addressLine2: cell(rec, map.addressLine2),
      postTown: cell(rec, map.postTown),
      county: cell(rec, map.county),
      country: cell(rec, map.country),
      postcode: cell(rec, map.postcode).toUpperCase(),
      sicText: cell(rec, map.sicText),
      sicText2: cell(rec, map.sicText2),
      sicText3: cell(rec, map.sicText3),
      sicText4: cell(rec, map.sicText4),
    },
  };
}
