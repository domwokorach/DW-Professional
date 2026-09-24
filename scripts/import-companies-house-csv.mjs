#!/usr/bin/env node
/**
 * Imports a Companies House "Basic Company Data" bulk CSV export
 * (https://download.companieshouse.gov.uk/en_output.html) into the local
 * CompanyRecord table, so /api/companies/search can answer lookups from
 * Postgres instead of calling the (rate-limited, key-gated) Companies House
 * REST API.
 *
 * Streams each file line by line (never holding the whole file in memory)
 * and writes in batches of BATCH_SIZE via `INSERT ... ON CONFLICT
 * (companyNumber) DO UPDATE`, which both dedupes by company number (a
 * later row for the same number overwrites the earlier one, matching the
 * order companies appear in the export) and updates existing companies
 * in place rather than deleting + reinserting them.
 *
 * Pass --replace to additionally remove, after every input file has been
 * imported, any company not touched by this run (i.e. dropped from the
 * new export). This is the monthly full-dataset refresh path. Because
 * every row is upserted (not deleted first) before the stale cleanup runs,
 * search never sees the table empty or missing a company that's still
 * current — only rows confirmed absent from the new file are ever removed,
 * and only after the new data is fully committed.
 *
 * Usage:
 *   node scripts/import-companies-house-csv.mjs <path-to-csv> [...more paths]
 *   node scripts/import-companies-house-csv.mjs --replace <path-to-csv>
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { PrismaClient, Prisma } from "../src/generated/company-client/index.js";
import { createId } from "@paralleldrive/cuid2";

// 17 bind params per row; Postgres caps a prepared statement at 32767 total,
// so this must stay under 32767/17 (~1927).
const BATCH_SIZE = 1000;
const MAX_RETRIES = 5;
const DELETE_BATCH_SIZE = 5000;
let prisma = new PrismaClient();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Long-running imports can outlive the DB's idle/connection limits (seen as
// "Server has closed the connection" mid-run). Retrying with a fresh client
// recovers instead of letting one dropped batch kill the whole import.
async function withRetry(fn) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      console.error(`\nBatch failed (attempt ${attempt}/${MAX_RETRIES}), retrying:`, error.message);
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

// Mirrors normalizeCompanyName in src/lib/companies/search.ts — kept as a
// plain duplicate here rather than importing that TS module into this
// standalone CLI script.
function normalizeCompanyName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizePostcode(postcode) {
  return postcode.trim().toLowerCase().replace(/\s+/g, "");
}

// One multi-row `INSERT ... ON CONFLICT (companyNumber) DO UPDATE` per batch,
// instead of one round trip per row — 2000 sequential upserts over a remote
// connection was slow enough to stall out on a full ~850k-row file.
async function upsertBatchWithRetry(batch, generation) {
  const values = batch.map(
    (row) => Prisma.sql`(
      ${createId()}, ${row.companyNumber}, ${row.name}, ${row.nameNormalized},
      ${row.status ?? null}, ${row.category ?? null}, ${row.incorporationDate ?? null},
      ${row.addressLine1 ?? null}, ${row.addressLine2 ?? null}, ${row.locality ?? null},
      ${row.region ?? null}, ${row.postalCode ?? null}, ${row.postcodeNormalized ?? null},
      ${row.country ?? null}, ${row.uri ?? null}, ${row.sicCodes},
      ${generation}, now(), now()
    )`
  );

  await withRetry(
    () => prisma.$executeRaw`
      INSERT INTO "CompanyRecord" (
        "id", "companyNumber", "name", "nameNormalized",
        "status", "category", "incorporationDate",
        "addressLine1", "addressLine2", "locality",
        "region", "postalCode", "postcodeNormalized",
        "country", "uri", "sicCodes",
        "importGeneration", "createdAt", "updatedAt"
      ) VALUES ${Prisma.join(values)}
      ON CONFLICT ("companyNumber") DO UPDATE SET
        "name" = EXCLUDED."name",
        "nameNormalized" = EXCLUDED."nameNormalized",
        "status" = EXCLUDED."status",
        "category" = EXCLUDED."category",
        "incorporationDate" = EXCLUDED."incorporationDate",
        "addressLine1" = EXCLUDED."addressLine1",
        "addressLine2" = EXCLUDED."addressLine2",
        "locality" = EXCLUDED."locality",
        "region" = EXCLUDED."region",
        "postalCode" = EXCLUDED."postalCode",
        "postcodeNormalized" = EXCLUDED."postcodeNormalized",
        "country" = EXCLUDED."country",
        "uri" = EXCLUDED."uri",
        "sicCodes" = EXCLUDED."sicCodes",
        "importGeneration" = EXCLUDED."importGeneration",
        "updatedAt" = now()
    `
  );
}

async function importFile(filePath, generation) {
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

    const postalCode = toNullable(get("RegAddress.PostCode"));

    batch.push({
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
    });

    if (batch.length >= BATCH_SIZE) {
      await upsertBatchWithRetry(batch, generation);
      total += batch.length;
      process.stdout.write(`\r${filePath}: imported ${total} rows (skipped ${skipped})`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertBatchWithRetry(batch, generation);
    total += batch.length;
  }

  process.stdout.write(`\r${filePath}: imported ${total} rows (skipped ${skipped})\n`);
}

// Removes companies left over from a previous generation once the new
// dataset has been fully imported — i.e. companies genuinely absent from
// this run's files. Deletes in small batches (rather than one statement)
// so a huge stale set doesn't hold a single long-running lock while
// concurrent searches are running.
async function deleteStaleGeneration(currentGeneration) {
  let deleted = 0;
  for (;;) {
    const stale = await prisma.companyRecord.findMany({
      where: { importGeneration: { not: currentGeneration } },
      select: { id: true },
      take: DELETE_BATCH_SIZE,
    });
    if (stale.length === 0) break;
    await withRetry(() =>
      prisma.companyRecord.deleteMany({ where: { id: { in: stale.map((r) => r.id) } } })
    );
    deleted += stale.length;
    process.stdout.write(`\rRemoving stale companies: ${deleted} removed`);
  }
  if (deleted > 0) process.stdout.write("\n");
  return deleted;
}

async function main() {
  const args = process.argv.slice(2);
  const replace = args.includes("--replace");
  const paths = args.filter((a) => a !== "--replace");

  if (paths.length === 0) {
    console.error(
      "Usage: node scripts/import-companies-house-csv.mjs [--replace] <path-to-csv> [...more paths]"
    );
    process.exit(1);
  }

  const generation = BigInt(Date.now());

  for (const filePath of paths) {
    await importFile(filePath, generation);
  }

  if (replace) {
    const deleted = await deleteStaleGeneration(generation);
    console.log(`Replace complete: removed ${deleted} companies no longer in the import.`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
