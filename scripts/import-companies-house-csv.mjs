#!/usr/bin/env node
/**
 * Imports a Companies House "Basic Company Data" bulk CSV export
 * (https://download.companieshouse.gov.uk/en_output.html) into the local
 * CompanyRecord table, so /api/companies/search can answer lookups from
 * Postgres instead of calling the (rate-limited, key-gated) Companies House
 * REST API.
 *
 * Usage: node scripts/import-companies-house-csv.mjs <path-to-csv> [...more paths]
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { PrismaClient } from "@prisma/client";

const BATCH_SIZE = 2000;
const MAX_RETRIES = 5;
let prisma = new PrismaClient();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Long-running imports can outlive the DB's idle/connection limits (seen as
// "Server has closed the connection" mid-run). Retrying with a fresh client
// recovers instead of letting one dropped batch kill the whole import.
async function insertBatchWithRetry(batch) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.companyRecord.createMany({ data: batch, skipDuplicates: true });
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      console.error(`\nBatch insert failed (attempt ${attempt}/${MAX_RETRIES}), retrying:`, error.message);
      await prisma.$disconnect().catch(() => {});
      prisma = new PrismaClient();
      await sleep(1000 * attempt);
    }
  }
}

function parseCsvLine(line) {
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

function indexHeader(headerFields) {
  const map = new Map();
  headerFields.forEach((name, i) => map.set(name.trim(), i));
  return (name) => {
    const i = map.get(name);
    return i === undefined ? undefined : i;
  };
}

function toNullable(value) {
  return value && value.length > 0 ? value : undefined;
}

// Companies House bulk export dates are DD/MM/YYYY.
function parseDate(value) {
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
function normalizeStatus(value) {
  const raw = toNullable(value);
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes("liquidation")) return "liquidation";
  if (lower.includes("administration")) return "administration";
  if (lower.includes("dissolved")) return "dissolved";
  if (lower.includes("active")) return "active";
  return lower.replace(/\s+/g, "-");
}

async function importFile(filePath) {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let getIndex = null;
  let batch = [];
  let total = 0;
  let skipped = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (!getIndex) {
      getIndex = indexHeader(parseCsvLine(line));
      continue;
    }

    const fields = parseCsvLine(line);
    const get = (name) => {
      const idx = getIndex(name);
      return idx === undefined ? undefined : fields[idx];
    };

    const companyNumber = toNullable(get("CompanyNumber"));
    const name = toNullable(get("CompanyName"));
    if (!companyNumber || !name) {
      skipped++;
      continue;
    }

    const sicCodes = [
      get("SICCode.SicText_1"),
      get("SICCode.SicText_2"),
      get("SICCode.SicText_3"),
      get("SICCode.SicText_4"),
    ]
      .map(toNullable)
      .filter((v) => Boolean(v));

    batch.push({
      companyNumber,
      name,
      status: normalizeStatus(get("CompanyStatus")),
      category: toNullable(get("CompanyCategory")),
      incorporationDate: parseDate(get("IncorporationDate")),
      addressLine1: toNullable(get("RegAddress.AddressLine1")),
      addressLine2: toNullable(get("RegAddress.AddressLine2")),
      locality: toNullable(get("RegAddress.PostTown")),
      region: toNullable(get("RegAddress.County")),
      postalCode: toNullable(get("RegAddress.PostCode")),
      country: toNullable(get("RegAddress.Country")),
      sicCodes,
    });

    if (batch.length >= BATCH_SIZE) {
      await insertBatchWithRetry(batch);
      total += batch.length;
      process.stdout.write(`\r${filePath}: imported ${total} rows (skipped ${skipped})`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatchWithRetry(batch);
    total += batch.length;
  }

  process.stdout.write(`\r${filePath}: imported ${total} rows (skipped ${skipped})\n`);
}

async function main() {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error("Usage: node scripts/import-companies-house-csv.mjs <path-to-csv> [...more paths]");
    process.exit(1);
  }

  for (const filePath of paths) {
    await importFile(filePath);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
