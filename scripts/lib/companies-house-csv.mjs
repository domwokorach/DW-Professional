/**
 * Parsing/normalizing helpers for the Companies House "Basic Company Data"
 * bulk CSV export, shared by scripts/import-companies-house-csv.mjs (local
 * file) and scripts/import-companies-house-s3.mjs (streamed from R2/S3) so
 * both read the same columns the same way.
 */

export function parseCsvLine(line) {
  const fields = [];
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

export function indexHeader(headerFields) {
  const map = new Map();
  headerFields.forEach((name, i) => map.set(name.trim(), i));
  return Object.fromEntries(map);
}

export function makeGetter(headerMap) {
  return (fields) => (name) => {
    const i = headerMap[name];
    return i === undefined ? undefined : fields[i];
  };
}

export function toNullable(value) {
  return value && value.length > 0 ? value : undefined;
}

// Companies House bulk export dates are DD/MM/YYYY.
export function parseDate(value) {
  const raw = toNullable(value);
  if (!raw) return undefined;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (!match) return undefined;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// Normalizes e.g. "Active" -> "active", "In Administration" -> "administration",
// to match the lowercase, hyphenless status values the search UI expects.
export function normalizeStatus(value) {
  const raw = toNullable(value);
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes("liquidation")) return "liquidation";
  if (lower.includes("administration")) return "administration";
  if (lower.includes("dissolved")) return "dissolved";
  if (lower.includes("active")) return "active";
  return lower.replace(/\s+/g, "-");
}

// Mirrors normalizeCompanyName in src/lib/companies/search.ts — kept as a
// plain duplicate here rather than importing that TS module into these
// standalone CLI scripts.
export function normalizeCompanyName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizePostcode(postcode) {
  return postcode.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * Builds a CompanyRecord row from one already-split CSV line, or returns
 * null (with a reason) if the row is missing a required field. `companyNumber`
 * is passed through untouched — never parsed as a number — so leading
 * zeroes in e.g. "01234567" survive intact.
 */
export function buildCompanyRow(fields, headerMap) {
  const get = makeGetter(headerMap)(fields);

  const companyNumber = toNullable(get("CompanyNumber"));
  const name = toNullable(get("CompanyName"));
  if (!companyNumber || !name) {
    return { row: null, reason: !companyNumber ? "missing CompanyNumber" : "missing CompanyName" };
  }

  const sicCodes = [
    get("SICCode.SicText_1"),
    get("SICCode.SicText_2"),
    get("SICCode.SicText_3"),
    get("SICCode.SicText_4"),
  ]
    .map(toNullable)
    .filter((v) => Boolean(v));

  const postalCode = toNullable(get("RegAddress.PostCode"));

  return {
    row: {
      companyNumber,
      name,
      nameNormalized: normalizeCompanyName(name),
      status: normalizeStatus(get("CompanyStatus")),
      category: toNullable(get("CompanyCategory")),
      incorporationDate: parseDate(get("IncorporationDate")),
      addressLine1: toNullable(get("RegAddress.AddressLine1")),
      addressLine2: toNullable(get("RegAddress.AddressLine2")),
      locality: toNullable(get("RegAddress.PostTown")),
      region: toNullable(get("RegAddress.County")),
      postalCode,
      postcodeNormalized: postalCode ? normalizePostcode(postalCode) : undefined,
      country: toNullable(get("RegAddress.Country")),
      uri: toNullable(get("URI")),
      sicCodes,
    },
    reason: null,
  };
}
