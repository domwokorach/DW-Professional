import { readFileSync } from "node:fs";
import path from "node:path";

export interface CsvCompany {
  name: string;
  industry?: string;
  location?: string;
}

const CSV_PATH = path.join(process.cwd(), "src", "data", "companies.csv");
const SEARCH_RESULT_LIMIT = 20;

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

/**
 * Parses the bundled UK company CSV into a deduplicated, sorted list —
 * dropping empty rows, trimming whitespace, and collapsing case-insensitive
 * duplicate names (keeping the first occurrence).
 */
function parseCompaniesCsv(raw: string): CsvCompany[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = header.indexOf("name");
  const industryIdx = header.indexOf("industry");
  const locationIdx = header.indexOf("location");
  if (nameIdx === -1) return [];

  const seen = new Set<string>();
  const companies: CsvCompany[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const name = fields[nameIdx]?.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    companies.push({
      name,
      industry: industryIdx !== -1 ? fields[industryIdx]?.trim() || undefined : undefined,
      location: locationIdx !== -1 ? fields[locationIdx]?.trim() || undefined : undefined,
    });
  }

  companies.sort((a, b) => a.name.localeCompare(b.name));
  return companies;
}

// Module-level cache: the CSV is bundled, read-only, and small enough to
// hold in memory for the life of the server instance — no need to re-read
// and re-parse it on every request.
let cache: CsvCompany[] | null = null;

export function getCsvCompanies(): CsvCompany[] {
  if (cache) return cache;
  const raw = readFileSync(CSV_PATH, "utf8");
  cache = parseCompaniesCsv(raw);
  return cache;
}

/**
 * Case-insensitive search over the CSV company list, capped at
 * SEARCH_RESULT_LIMIT so a large dataset never renders (or gets serialized)
 * all at once. Matches whose name starts with the query are ranked above
 * matches where the query only appears mid-name.
 */
export function searchCsvCompanies(query: string, limit = SEARCH_RESULT_LIMIT): CsvCompany[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const companies = getCsvCompanies();
  const startsWith: CsvCompany[] = [];
  const contains: CsvCompany[] = [];

  for (const company of companies) {
    const lowerName = company.name.toLowerCase();
    if (lowerName.startsWith(term)) {
      startsWith.push(company);
    } else if (lowerName.includes(term)) {
      contains.push(company);
    }
    if (startsWith.length >= limit) break;
  }

  return [...startsWith, ...contains].slice(0, limit);
}

// Exposed for tests / one-off verification of the CSV parsing rules.
export { parseCompaniesCsv };
