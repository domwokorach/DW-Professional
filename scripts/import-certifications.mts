/**
 * Imports certificates from `.certification` (PDF, PNG, JPG, JPEG, WebP) into
 * public/certifications as optimised WebP previews and writes
 * src/data/certifications.generated.json. Needs `pdftoppm` (poppler) and ImageMagick for PDFs.
 * Usage: npx tsx scripts/import-certifications.mts
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { certificationIssuer, localCertificationMetadata } from '../src/data/certification-metadata.ts';

const SOURCE = '.certification';
const OUT_DIR = 'public/certifications';
const MANIFEST = 'src/data/certifications.generated.json';
const SUPPORTED = /\.(pdf|png|jpe?g|webp)$/i;

if (!existsSync(SOURCE)) {
  console.warn(`[certifications] ${SOURCE} not found; manifest left unchanged.`);
  process.exit(0);
}
mkdirSync(OUT_DIR, { recursive: true });

const seenHashes = new Set<string>();
const seenSlugs = new Set<string>();
const items: Record<string, unknown>[] = [];

const files = readdirSync(SOURCE).filter((f) => SUPPORTED.test(f) && !f.startsWith('.')).sort();
for (const file of files) {
  try {
    const path = join(SOURCE, file);
    const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
    if (seenHashes.has(hash)) { console.warn(`[certifications] Skipped duplicate file: ${file}`); continue; }
    const slug = basename(file, extname(file)).replace(/[\s_-]*certificate$/i, '').trim().replace(/\s+/g, '_').toLowerCase();
    if (seenSlugs.has(slug)) { console.warn(`[certifications] Skipped duplicate record: ${file}`); continue; }
    const out = join(OUT_DIR, `${slug}.webp`);
    if (/\.pdf$/i.test(file)) {
      const tmp = join(OUT_DIR, `.${slug}`);
      execFileSync('pdftoppm', ['-png', '-r', '150', '-f', '1', '-l', '1', '-singlefile', path, tmp]);
      execFileSync('magick', [`${tmp}.png`, '-resize', '1800x', '-quality', '86', out]);
      execFileSync('rm', [`${tmp}.png`]);
    } else {
      execFileSync('magick', [path, '-auto-orient', '-resize', '1800x>', '-quality', '86', out]);
    }
    seenHashes.add(hash); seenSlugs.add(slug);
    const meta = localCertificationMetadata[slug];
    if (!meta) console.warn(`[certifications] No verified metadata for ${file}; title taken from file name.`);
    items.push({
      id: hash.slice(0, 16),
      name: meta?.title ?? slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      objectKey: file,
      url: `/certifications/${slug}.webp`,
      ...(meta ? { issuer: certificationIssuer, technology: meta.technology, category: meta.category, level: meta.level, issuedAt: meta.issuedAt } : {}),
    });
  } catch (error) {
    console.warn(`[certifications] Could not import ${file}:`, (error as Error).message);
  }
}

writeFileSync(MANIFEST, `${JSON.stringify(items, null, 2)}\n`);
console.log(`[certifications] Imported ${items.length} of ${files.length} files.`);
