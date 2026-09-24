#!/usr/bin/env node
/**
 * One-off copy of CompanyRecord rows from the main database (DATABASE_URL)
 * into the standalone Companies House database (COMPANY_DATABASE_URL —
 * see prisma/company/schema.prisma). Part of migrating company search off
 * the main database; see the plan for the full cutover sequence.
 *
 * Read-only against the source: never deletes or modifies rows in the main
 * database. Upserts (keyed on companyNumber) into the destination, so this
 * is safe to re-run for a final delta sync right before cutover.
 *
 * Usage:
 *   npm run db:company:copy
 */
import { PrismaClient as SourcePrismaClient } from "@prisma/client";
import { PrismaClient as CompanyPrismaClient } from "../src/generated/company-client/index.js";

const BATCH_SIZE = 2000;

const source = new SourcePrismaClient();
const destination = new CompanyPrismaClient();

async function copyAll() {
  const totalSource = await source.companyRecord.count();
  console.log(`Source CompanyRecord rows: ${totalSource}`);

  let cursor;
  let copied = 0;

  while (true) {
    const rows = await source.companyRecord.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });
    if (rows.length === 0) break;

    await destination.$transaction(
      rows.map((row) =>
        destination.companyRecord.upsert({
          where: { companyNumber: row.companyNumber },
          create: row,
          update: row,
        })
      )
    );

    copied += rows.length;
    cursor = rows[rows.length - 1].id;
    process.stdout.write(`\rCopied ${copied}/${totalSource}`);
  }
  console.log();

  const totalDestination = await destination.companyRecord.count();
  console.log(`Destination CompanyRecord rows: ${totalDestination}`);
  if (totalDestination !== totalSource) {
    console.warn(
      `WARNING: row count mismatch (source ${totalSource} vs destination ${totalDestination}) — ` +
        `expected if the destination already had rows from a prior partial copy or manual edits.`
    );
  } else {
    console.log("Row counts match.");
  }

  await destination.$executeRawUnsafe('ANALYZE "CompanyRecord";');
  console.log('Ran ANALYZE "CompanyRecord" on the destination.');
}

copyAll()
  .catch((error) => {
    console.error("Copy failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await source.$disconnect();
    await destination.$disconnect();
  });
