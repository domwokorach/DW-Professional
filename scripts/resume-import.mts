/**
 * Stores the protected résumé PDF in the database (table ResumeFile). It is only ever served after email verification.
 * Usage: npm run resume:import -- path/to/resume.pdf
 * Uses DATABASE_URL (or PORTFOLIO_DATABASE_URL) from the environment: check which database that is before running.
 */
import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { storeResumeFile } from '../src/lib/resume-store.server.ts';

const MAX_BYTES = 8 * 1024 * 1024;
const path = process.argv[2];
if (!path) {
  console.error('Usage: npm run resume:import -- path/to/resume.pdf');
  process.exit(1);
}
if (statSync(path).size > MAX_BYTES) {
  console.error('The file is larger than 8 MB.');
  process.exit(1);
}
const data = readFileSync(path);
if (data.subarray(0, 5).toString('latin1') !== '%PDF-') {
  console.error('That file is not a PDF (missing %PDF- header).');
  process.exit(1);
}
const filename = basename(path).replace(/[^\w.\- ]/g, '_');
const { size, sha256 } = await storeResumeFile(filename, data);
console.log(`Stored "${filename}" (${size} bytes, sha256 ${sha256.slice(0, 12)}…) as the protected résumé.`);
process.exit(0);
