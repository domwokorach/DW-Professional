/**
 * Parses and validates a company CSV export for import into the
 * CompanyRecord table (see prisma/schema.prisma). Shared by the admin
 * upload endpoint (src/app/api/admin/companies/import/route.ts) and the CLI
 * bulk-import script (scripts/import-companies-house-csv.mjs) so both paths
 * apply the same header rules, row validation, and dedup logic.
 *
 * Accepted headers are matched case-insensitively and ignore spaces,
 * underscores and punctuation, so `company_name`, `Company Name` and
 * `CompanyName` (the Companies House bulk export's own header) are all
 * recognised as the same column.
 */

export interface ParsedCompanyRow {
  companyNumber?: string;
  name: string;
  status?: string;
  /** Generic single-line address, from a plain "address" column or RegAddress.AddressLine1. */
  address?: string;
  category?: string;
  addressLine2?: string;
  locality?: string;
  region?: string;
  postcode?: string;
  country?: string;
  uri?: string;
}

export interface CsvImportResult {
  records: ParsedCompanyRow[];
  totalRows: number;
  imported: number;
  skippedEmpty: number;
  duplicates: number;
  truncated: boolean;
}

export class CsvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvValidationError";
  }
}

// Defends against a pathological upload (e.g. a huge file that slipped past
// the byte-size check because it's mostly short lines) exhausting server
// memory — anything beyond this is dropped with `truncated: true` rather
// than processed.
const MAX_ROWS = 100_000;

type CanonicalField =
  | "companyNumber"
  | "name"
  | "status"
  | "address"
  | "category"
  | "addressLine2"
  | "locality"
  | "region"
  | "postcode"
  | "country"
  | "uri";

// Normalizing to bare lowercase alphanumerics means `company_name`,
// `Company Name` and `CompanyName` (Companies House's own bulk-export
// header) all collapse to the same key.
function normalizeHeaderToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

const ALIAS_MAP: Record<string, CanonicalField> = {
  companynumber: "companyNumber",
  regnumber: "companyNumber",
  registrationnumber: "companyNumber",
  companyname: "name",
  name: "name",
  companystatus: "status",
  status: "status",
  companycategory: "category",
  category: "category",
  address: "address",
  companyaddress: "address",
  regaddress: "address",
  regaddressaddressline1: "address",
  location: "address",
  regaddressaddressline2: "addressLine2",
  addressline2: "addressLine2",
  regaddressposttown: "locality",
  posttown: "locality",
  city: "locality",
  regaddresscounty: "region",
  county: "region",
  regaddresspostcode: "postcode",
  postcode: "postcode",
  postalcode: "postcode",
  zip: "postcode",
  regaddresscountry: "country",
  country: "country",
  uri: "uri",
  companieshouseuri: "uri",
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

function toNullable(value: string | undefined): string | undefined {
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeCompanyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Parses raw CSV text into deduplicated company rows ready for import.
 * Throws CsvValidationError for structural problems (no header, missing
 * required column, unreadable content) — per-row problems (an empty
 * company_name, a repeated company) are dropped silently and counted in the
 * returned report instead, since a bad row shouldn't fail the whole import.
 */
export function parseCompanyCsv(raw: string): CsvImportResult {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new CsvValidationError("The CSV file is empty.");
  }

  // Strip a UTF-8 BOM, which some spreadsheet tools prepend and which would
  // otherwise corrupt the first header name.
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new CsvValidationError("The CSV file is empty.");
  }

  const headerFields = parseCsvLine(lines[0]);
  const columnFields = new Map<number, CanonicalField>();
  headerFields.forEach((header, index) => {
    const canonical = ALIAS_MAP[normalizeHeaderToken(header)];
    if (canonical) columnFields.set(index, canonical);
  });

  const nameColumnIndex = [...columnFields.entries()].find(([, field]) => field === "name")?.[0];
  if (nameColumnIndex === undefined) {
    throw new CsvValidationError(
      "The CSV is missing a required \"company_name\" column. Expected headers: company_name, company_number, company_status, address."
    );
  }

  const seen = new Set<string>();
  const records: ParsedCompanyRow[] = [];
  let skippedEmpty = 0;
  let duplicates = 0;
  let truncated = false;

  const dataLines = lines.slice(1);
  for (let i = 0; i < dataLines.length; i++) {
    if (records.length >= MAX_ROWS) {
      truncated = true;
      break;
    }

    const fields = parseCsvLine(dataLines[i]);
    const row: Partial<Record<CanonicalField, string | undefined>> = {};
    for (const [index, field] of columnFields) {
      row[field] = toNullable(fields[index]);
    }

    const name = row.name;
    if (!name) {
      skippedEmpty++;
      continue;
    }

    const companyNumber = row.companyNumber;
    const dedupKey = companyNumber
      ? `num:${companyNumber.toLowerCase()}`
      : `name:${normalizeCompanyName(name)}`;
    if (seen.has(dedupKey)) {
      duplicates++;
      continue;
    }
    seen.add(dedupKey);

    records.push({
      name,
      companyNumber,
      status: row.status,
      address: row.address,
      category: row.category,
      addressLine2: row.addressLine2,
      locality: row.locality,
      region: row.region,
      postcode: row.postcode,
      country: row.country,
      uri: row.uri,
    });
  }

  return {
    records,
    totalRows: dataLines.length,
    imported: records.length,
    skippedEmpty,
    duplicates,
    truncated,
  };
}

export { parseCsvLine };
