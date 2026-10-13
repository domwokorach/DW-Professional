import { GRANT_COOKIE, json, readCookie } from '@/lib/resume-api.server';
import { authoriseDownload } from '@/lib/resume-store.server';

export const dynamic = 'force-dynamic';

/** The protected résumé PDF. Requires the grant cookie issued by /api/resume/verify; there is no other way to it. */
export async function GET(request: Request) {
  const grant = readCookie(request, GRANT_COOKIE);
  if (!grant || !/^[A-Za-z0-9_-]{43}$/.test(grant)) return json({ error: 'forbidden' }, 403);
  const file = await authoriseDownload(grant);
  if (file === null) return json({ error: 'forbidden' }, 403);
  if (file === 'none') return json({ error: 'unavailable' }, 503);
  return new Response(new Uint8Array(file.data), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(file.size),
      'Content-Disposition': `attachment; filename="${file.filename.replace(/[^\w.\- ]/g, '_')}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
