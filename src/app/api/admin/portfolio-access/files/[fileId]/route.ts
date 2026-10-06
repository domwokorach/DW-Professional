import { requireAdminSession } from '@/lib/admin/session.server';
import { isPreviewable } from '@/lib/portfolio-access';
import { getAccessFile } from '@/lib/portfolio-access-store.server';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'private, no-store' };

/**
 * Admin only (session cookie): one file attached to a Portfolio Access session. Files live in the private database,
 * never at a public URL; this authenticated route is the only way to read them.
 *
 * - default: downloads it (Content-Disposition: attachment);
 * - ?inline=1: shows a PDF or image in the browser (the session page's Preview and Open), framable only by this site.
 *   Word documents are always downloaded.
 *
 * Responses are nosniff with a locked-down CSP: images are additionally sandboxed; PDFs can't be sandboxed (that
 * stops the browser's PDF viewer), but a PDF can't run this site's scripts and may only be framed by this site.
 */
export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const auth = await requireAdminSession(request);
  if (auth instanceof Response) return auth;
  const { fileId } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(fileId)) return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
  try {
    const file = await getAccessFile(fileId);
    if (!file) return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
    const inline = new URL(request.url).searchParams.get('inline') === '1' && isPreviewable(file.mimeType);
    const ascii = file.filename.replace(/[^\w.\- ]+/g, '_');
    const csp = file.mimeType === 'application/pdf'
      ? "default-src 'none'; frame-ancestors 'self'"
      : "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'self'; sandbox";
    return new Response(new Uint8Array(file.data), {
      headers: {
        ...noStore,
        'Content-Type': file.mimeType,
        'Content-Length': String(file.size),
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
        'X-Content-Type-Options': 'nosniff',
        // frame-ancestors overrides the admin area's X-Frame-Options: DENY, so the session page can embed a preview.
        'Content-Security-Policy': csp,
        'Cross-Origin-Resource-Policy': 'same-origin',
      },
    });
  } catch (err) {
    console.error('[admin-sessions] File request failed:', (err as Error).name, (err as { code?: string }).code);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: noStore });
  }
}
