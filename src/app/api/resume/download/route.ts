import { GRANT_COOKIE, json, readCookie } from '@/lib/resume-api.server';
import { RESUME_DOWNLOAD_FILENAME } from '@/lib/resume-access';
import { authoriseDownload } from '@/lib/resume-store.server';

export const dynamic = 'force-dynamic';

const PDF_SIGNATURE = '%PDF-';

/** The protected résumé PDF. Requires the grant cookie issued by /api/resume/verify; there is no other way to it. */
export async function GET(request: Request) {
  const grant = readCookie(request, GRANT_COOKIE);
  if (!grant || !/^[A-Za-z0-9_-]{43}$/.test(grant)) return json({ error: 'forbidden' }, 403);
  const file = await authoriseDownload(grant);
  if (file === null) return json({ error: 'forbidden' }, 403);
  if (file === 'none') return json({ error: 'unavailable' }, 503);
  if (file === 'error') return json({ error: 'storage_error' }, 503);
  // Never serve anything that is not a real PDF as a successful download.
  if (file.data.subarray(0, PDF_SIGNATURE.length).toString('latin1') !== PDF_SIGNATURE) return json({ error: 'storage_error' }, 503);
  return new Response(new Uint8Array(file.data), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(file.data.length),
      'Content-Disposition': `attachment; filename="${RESUME_DOWNLOAD_FILENAME}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      Pragma: 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
