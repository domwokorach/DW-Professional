#!/usr/bin/env node
/**
 * Streams the Companies House "Basic Company Data" bulk CSV directly from
 * the configured R2/S3 object (COMPANIES_S3_URI / AWS_S3_BUCKET+AWS_S3_KEY)
 * into the CompanyRecord table — never buffering the whole (multi-GB) file
 * in memory or on disk.
 *
 * This is a standalone CLI script, not an HTTP route: a 3 GB transfer would
 * blow past any request timeout, so it's meant to be run manually or from a
 * scheduled job (see package.json's "import:companies:s3" script), never
 * from a page request or deploy step. The admin "Import from configured
 * source" panel (src/app/api/admin/companies/import/s3/route.ts) only
 * validates the requested source and records/reads CompanyImportRun rows —
 * it does not perform the transfer itself.
 *
 * Resumable: progress (byte offset into the object, header column layout,
 * row/reject counts) is checkpointed to a CompanyImportRun row after every
 * batch. Re-running while a "running" row exists for the same source
 * resumes with an S3 Range GET from that byte offset instead of
 * re-downloading from the start.
 *
 * Idempotent: every row is an `UPSERT ... ON CONFLICT (companyNumber)`, so
 * replaying already-imported lines after a resume (or running the script
 * twice) never creates duplicates.
 *
 * Previous dataset stays available on failure: stale rows from an older
 * import generation are only deleted after this run reaches "succeeded" —
 * see deleteStaleGeneration below, and CompanyRecord.importGeneration in
 * prisma/schema.prisma.
 *
 * Usage:
 *   node scripts/import-companies-house-s3.mjs [--no-replace]
 */
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { parseCsvLine, indexHeader, buildCompanyRow } from "./lib/companies-house-csv.mjs";
import { categorizeS3Error, safeS3ErrorLogFields } from "./lib/s3-errors.mjs";

const BATCH_SIZE = 2000;
const MAX_RETRIES = 5;
const DELETE_BATCH_SIZE = 5000;
const MAX_ERROR_SAMPLES = 50;

let prisma = new PrismaClient();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Reads the configured source and cross-checks COMPANIES_S3_URI against
 * AWS_S3_BUCKET/AWS_S3_KEY. A mismatch is a configuration error that stops
 * the run — the bucket name is never silently corrected or renamed.
 *
 * Targets native AWS S3: AWS_REGION is required (no "auto" default — that's
 * an R2-only convention) and AWS_S3_ENDPOINT is optional, only needed to
 * point at a non-default/S3-compatible endpoint.
 */
function resolveS3Config() {
  const uri = requiredEnv("COMPANIES_S3_URI");
  const bucket = requiredEnv("AWS_S3_BUCKET");
  const key = requiredEnv("AWS_S3_KEY");
  const region = requiredEnv("AWS_REGION");
  const endpoint = process.env.AWS_S3_ENDPOINT || undefined;

  const match = /^s3:\/\/([^/]+)\/(.+)$/.exec(uri);
  if (!match) throw new Error(`COMPANIES_S3_URI is not a valid s3:// URI: ${uri}`);
  const [, uriBucket, uriKey] = match;
  if (uriBucket !== bucket) {
    throw new Error(
      `COMPANIES_S3_URI bucket ("${uriBucket}") does not match AWS_S3_BUCKET ("${bucket}"). Fix the configuration rather than guessing which is right.`
    );
  }
  if (uriKey !== key) {
    throw new Error(
      `COMPANIES_S3_URI key ("${uriKey}") does not match AWS_S3_KEY ("${key}"). Fix the configuration rather than guessing which is right.`
    );
  }

  return { uri, bucket, key, endpoint, region, sourceKey: `${bucket}/${key}` };
}

async function withRetry(fn) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      console.error(`\nOperation failed (attempt ${attempt}/${MAX_RETRIES}), retrying:`, error.message);
      await prisma.$disconnect().catch(() => {});
      prisma = new PrismaClient();
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Splits a Node.js readable byte stream into lines without ever decoding a
 * partial UTF-8 multi-byte sequence (splits on the raw 0x0A byte, which
 * can't appear inside a UTF-8 continuation byte) and yields the exact
 * cumulative byte offset immediately after each line — precise enough to
 * resume later with `Range: bytes=<offset>-` and land exactly on the next
 * line's first byte.
 */
async function* streamLines(body, baseOffset) {
  let carry = Buffer.alloc(0);
  let offset = baseOffset;
  for await (const chunk of body) {
    carry = carry.length > 0 ? Buffer.concat([carry, chunk]) : Buffer.from(chunk);
    let newlineIndex;
    while ((newlineIndex = carry.indexOf(0x0a)) !== -1) {
      const consumed = newlineIndex + 1;
      const lineBuf = carry.subarray(0, newlineIndex);
      carry = Buffer.from(carry.subarray(consumed));
      offset += BigInt(consumed);
      let line = lineBuf.toString("utf8");
      if (line.endsWith("\r")) line = line.slice(0, -1);
      yield { line, offset };
    }
  }
  if (carry.length > 0) {
    offset += BigInt(carry.length);
    let line = carry.toString("utf8");
    if (line.endsWith("\r")) line = line.slice(0, -1);
    yield { line, offset };
  }
}

async function upsertBatchWithRetry(batch, generation) {
  await withRetry(() =>
    prisma.$transaction(
      batch.map((row) =>
        prisma.companyRecord.upsert({
          where: { companyNumber: row.companyNumber },
          create: { ...row, importGeneration: generation },
          update: { ...row, importGeneration: generation },
        })
      )
    )
  );
}

// Removes companies left over from a previous generation once the new
// dataset has been fully imported — only rows confirmed absent from the new
// file, and only after it's fully committed (see the module doc comment).
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

async function loadOrCreateRun(sourceKey) {
  const existing = await prisma.companyImportRun.findFirst({
    where: { sourceKey, status: "running" },
    orderBy: { startedAt: "desc" },
  });
  if (existing) return existing;
  return prisma.companyImportRun.create({
    data: { sourceKey, generation: BigInt(Date.now()), status: "running" },
  });
}

function formatProgress(byteOffset, totalBytes) {
  if (!totalBytes) return `${byteOffset} bytes`;
  const pct = ((Number(byteOffset) / Number(totalBytes)) * 100).toFixed(1);
  return `${pct}%`;
}

async function recordFailure(sourceKey, runId, message) {
  const errorDetails = [{ reason: message, at: new Date().toISOString() }];
  try {
    if (runId) {
      await prisma.companyImportRun.update({
        where: { id: runId },
        data: { status: "failed", completedAt: new Date(), errorDetails },
      });
    } else {
      await prisma.companyImportRun.create({
        data: {
          sourceKey,
          generation: BigInt(Date.now()),
          status: "failed",
          completedAt: new Date(),
          errorDetails,
        },
      });
    }
  } catch (error) {
    console.error("Failed to record import failure:", error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const noReplace = args.includes("--no-replace");

  const config = resolveS3Config();
  const client = new S3Client({
    region: config.region,
    // Only set for a non-default endpoint (e.g. an S3-compatible store);
    // native AWS S3 resolves its endpoint from the region automatically.
    ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId: requiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });

  let head;
  try {
    head = await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: config.key }));
  } catch (error) {
    const categorized = categorizeS3Error(error);
    console.error(`Object not found or inaccessible: s3://${config.bucket}/${config.key}`);
    // Safe diagnostics only — bucket/key/region/error code/request id, never credentials.
    console.error(JSON.stringify(safeS3ErrorLogFields(config, categorized)));
    await recordFailure(config.sourceKey, null, `HeadObject failed (${categorized.category}): ${error.message}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const run = await loadOrCreateRun(config.sourceKey);
  const generation = run.generation;
  const resuming = run.byteOffset > 0n && Boolean(run.headerFields);

  if (resuming) {
    console.log(`Resuming import ${run.id} from byte ${run.byteOffset} (${run.rowCount} rows already imported).`);
  } else {
    console.log(`Starting new import ${run.id}.`);
  }

  let getResult;
  try {
    getResult = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: config.key,
        Range: resuming ? `bytes=${run.byteOffset}-` : undefined,
      })
    );
  } catch (error) {
    const categorized = categorizeS3Error(error);
    console.error(JSON.stringify(safeS3ErrorLogFields(config, categorized)));
    await recordFailure(config.sourceKey, run.id, `GetObject failed (${categorized.category}): ${error.message}`);
    await prisma.$disconnect();
    console.error("Failed to start download:", error.message);
    process.exit(1);
  }

  let headerMap = resuming ? run.headerFields : null;
  let byteOffset = BigInt(run.byteOffset);
  let rowCount = run.rowCount;
  let rejectedRows = run.rejectedRows;
  let errorSamples = Array.isArray(run.errorDetails) ? [...run.errorDetails] : [];
  let batch = [];
  let sawHeader = resuming;

  async function commitCheckpoint() {
    await withRetry(() =>
      prisma.companyImportRun.update({
        where: { id: run.id },
        data: {
          byteOffset,
          rowCount,
          rejectedRows,
          errorDetails: errorSamples.length ? errorSamples : undefined,
          headerFields: headerMap ?? undefined,
          totalBytes: head.ContentLength != null ? BigInt(head.ContentLength) : undefined,
        },
      })
    );
  }

  try {
    for await (const { line, offset } of streamLines(getResult.Body, byteOffset)) {
      if (!line.trim()) {
        byteOffset = offset;
        continue;
      }

      if (!sawHeader) {
        headerMap = indexHeader(parseCsvLine(line));
        sawHeader = true;
        byteOffset = offset;
        continue;
      }

      const { row, reason } = buildCompanyRow(parseCsvLine(line), headerMap);
      byteOffset = offset;

      if (!row) {
        rejectedRows++;
        if (errorSamples.length < MAX_ERROR_SAMPLES) {
          errorSamples.push({ row: rowCount + rejectedRows, reason });
        }
        continue;
      }

      batch.push(row);

      if (batch.length >= BATCH_SIZE) {
        await upsertBatchWithRetry(batch, generation);
        rowCount += batch.length;
        batch = [];
        await commitCheckpoint();
        process.stdout.write(
          `\rImported ${rowCount} rows (rejected ${rejectedRows}, ${formatProgress(byteOffset, head.ContentLength)})`
        );
      }
    }

    if (batch.length > 0) {
      await upsertBatchWithRetry(batch, generation);
      rowCount += batch.length;
      batch = [];
    }
    await commitCheckpoint();
  } catch (error) {
    await recordFailure(config.sourceKey, run.id, error.message);
    await prisma.$disconnect();
    console.error("\nImport failed (previous dataset was left untouched):", error.message);
    console.error(`Re-run this script to resume from byte ${byteOffset}.`);
    process.exit(1);
  }

  let deleted = 0;
  if (!noReplace) {
    deleted = await deleteStaleGeneration(generation);
  }

  await prisma.companyImportRun.update({
    where: { id: run.id },
    data: { status: "succeeded", completedAt: new Date() },
  });

  console.log(
    `\nImport complete: ${rowCount} rows imported, ${rejectedRows} rejected` +
      (!noReplace ? `, ${deleted} stale rows removed` : "") +
      "."
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
