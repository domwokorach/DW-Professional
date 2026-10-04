// Imports the company CSV into the company database. Run it by hand, never as part of `build` or a
// deploy:
//   npm run companies:import                         # stream the CSV from S3 (AWS_S3_BUCKET / AWS_S3_KEY)
//   npm run companies:import -- --dry-run            # parse and validate only; no database writes
//   npm run companies:import -- --file ./sample.csv  # a local file instead of S3
//   npm run companies:import -- --limit 1000         # stop after N rows (to try it out)
//
// The file is streamed (never held in memory), validated row by row, and upserted in batches keyed
// on company number, so re-running is safe and never duplicates a company.
import 'dotenv/config';
import { createReadStream } from 'node:fs';
import type { Readable } from 'node:stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { parse } from 'csv-parse';
import { mapHeaders, mapRow, type CompanyRow, type HeaderMap } from '@/lib/company-csv';
import { companyDatabaseEnabled, getCompanyPrisma, upsertCompanies } from '@/lib/company-db.server';
import { getCompaniesS3 } from '@/lib/s3.server';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const dryRun = flag('dry-run');
const file = value('file');
const limit = value('limit') ? Number(value('limit')) : Infinity;
const batchSize = value('batch') ? Number(value('batch')) : 5000;
if (!(limit > 0) || !(batchSize > 0)) fail('--limit and --batch must be positive numbers.');

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

async function openSource(): Promise<{ stream: Readable; label: string }> {
  if (file) return { stream: createReadStream(file), label: file };
  const s3 = getCompaniesS3();
  if (!s3) fail('S3 is not configured: set AWS_REGION, AWS_S3_BUCKET and AWS_S3_KEY (or use --file).');
  try {
    const res = await s3.client.send(new GetObjectCommand({ Bucket: s3.bucket, Key: s3.key }));
    if (!res.Body) fail('The S3 object has no body.');
    return { stream: res.Body as Readable, label: `s3://${s3.bucket}/${s3.key}` };
  } catch (err) {
    // The error name (NoSuchBucket, NoSuchKey, AccessDenied…) is enough; never print more.
    fail(`Could not read the CSV from S3: ${(err as Error).name}.`);
  }
}

async function main() {
  let prisma = null as ReturnType<typeof getCompanyPrisma>;
  if (!dryRun) {
    if (!companyDatabaseEnabled()) fail('COMPANY_DATABASE_URL is not set. Use --dry-run to validate the CSV without a database.');
    prisma = getCompanyPrisma();
    console.log(`Target database host: ${new URL(process.env.COMPANY_DATABASE_URL!).host}, schema "${process.env.COMPANY_DATABASE_SCHEMA || 'companies'}"`);
  }

  const { stream, label } = await openSource();
  console.log(`${dryRun ? 'Validating' : 'Importing'} ${label}${Number.isFinite(limit) ? ` (first ${limit} rows)` : ''}`);

  const stats = { read: 0, imported: 0, missingNumber: 0, missingName: 0, badNumber: 0 };
  let headerMap: HeaderMap = {};
  const parser = parse({
    columns: (header: string[]) => {
      headerMap = mapHeaders(header);
      return header;
    },
    bom: true,
    trim: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    // No company record is anywhere near this size; a "record" this large means an unbalanced quote
    // is swallowing the lines after it.
    max_record_size: 100_000,
    // Deliberately no skip_records_with_error: after a quote-structure error the parser's state is
    // unreliable and it can silently drop every line that follows, so any parse error stops the
    // import. Row-level problems (below) are skipped and counted instead.
  });
  stream.on('error', (err) => parser.destroy(err));
  stream.pipe(parser);

  let batch: CompanyRow[] = [];
  let sample: CompanyRow[] = [];
  const flush = async () => {
    if (!batch.length) return;
    if (prisma) stats.imported += await upsertCompanies(prisma, batch);
    else stats.imported += batch.length;
    batch = [];
  };

  try {
    for await (const rec of parser as AsyncIterable<Record<string, string>>) {
      stats.read += 1;
      const result = mapRow(rec, headerMap);
      if ('skip' in result) {
        if (result.skip === 'missing-number') stats.missingNumber += 1;
        else if (result.skip === 'missing-name') stats.missingName += 1;
        else stats.badNumber += 1;
      } else {
        batch.push(result.row);
        if (sample.length < 3) sample.push(result.row);
        if (batch.length >= batchSize) await flush();
      }
      if (stats.read % 100_000 === 0) console.log(`  …${stats.read.toLocaleString('en-GB')} rows read`);
      if (stats.read >= limit) break;
    }
    await flush();
  } catch (err) {
    const e = err as { code?: string; name?: string; message?: string };
    // CSV problems (a bad header, say) have useful messages; database and network errors only get a code.
    const csvProblem = e.message?.startsWith('The CSV must have') || e.code?.startsWith('CSV_');
    fail(`Import stopped (${stats.read.toLocaleString('en-GB')} rows processed so far): ${csvProblem ? `${e.message}. The rest of the file was not read.` : (e.code ?? e.name ?? 'unknown error') + '.'}`);
  } finally {
    stream.destroy();
    await prisma?.$disconnect();
  }

  const skipped = stats.missingNumber + stats.missingName + stats.badNumber;
  console.log(`\n${dryRun ? 'Valid rows' : 'Upserted'}: ${stats.imported.toLocaleString('en-GB')} of ${stats.read.toLocaleString('en-GB')} read`);
  console.log(`Skipped: ${skipped} (no number ${stats.missingNumber}, no name ${stats.missingName}, invalid number ${stats.badNumber})`);
  if (dryRun) console.log('First rows:', sample);
}

main();
