import { RESUME_FILENAME, fetchResumePdf } from '@/lib/resume-pdf.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await fetchResumePdf();
  if (!result.ok) {
    // A plain error response: never sent as an attachment, so it can't be saved as a "résumé".
    return Response.json({ error: result.message }, { status: result.status, headers: { 'Cache-Control': 'no-store' } });
  }
  return new Response(result.bytes as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${RESUME_FILENAME}"`,
      'Content-Length': String(result.bytes.length),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
