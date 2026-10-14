import { createRateLimit } from '@/lib/rate-limit.server';
import { trustedClientIp } from '@/lib/request.server';
import { readCurrentResume } from '@/lib/resume-store.server';

export const dynamic = 'force-dynamic';

const FILENAME = 'resume.pdf';
const limited = createRateLimit({ windowMs: 60_000, max: 30 });

const page = (title: string, message: string) => `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f3e7;color:#25233f;font:16px/1.5 system-ui,sans-serif;padding:24px;text-align:center}main{max-width:420px}h1{font-size:22px;margin:0 0 8px}a{display:inline-block;margin:8px 6px 0;padding:12px 22px;border-radius:999px;background:#25233f;color:#f7f3e7;text-decoration:none;font-weight:600}a.alt{background:transparent;color:#25233f;border:1px solid #25233f}a:focus-visible{outline:3px solid #7a6cff;outline-offset:3px}</style></head>
<body><main><h1>${title}</h1><p>${message}</p><a href="/api/resume/quick-download" download="${FILENAME}">Download PDF</a><a class="alt" href="/en-gb">Visit the portfolio</a></main></body></html>`;

const errorPage = (status: number, title: string, message: string) =>
  new Response(page(title, message), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });

/**
 * Public recruiter shortcut (the QR code on the Developer ID card): the résumé PDF downloads immediately, with no
 * form, PIN or login. Every other résumé route keeps the email verification. Failures show a page, never a file.
 */
export async function GET(request: Request) {
  if (limited(`quick:${trustedClientIp(request) ?? 'unknown'}`)) {
    return errorPage(429, 'Too many requests', 'Please wait a minute and try again.');
  }
  const file = await readCurrentResume();
  if (file === 'none' || file === 'error') {
    return errorPage(503, 'Résumé temporarily unavailable', 'The résumé could not be loaded right now. Please try again in a moment.');
  }
  // Only ever serve real PDF bytes as a successful download.
  if (file.data.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return errorPage(503, 'Résumé temporarily unavailable', 'The résumé could not be loaded right now. Please try again in a moment.');
  }
  return new Response(new Uint8Array(file.data), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(file.size),
      'Content-Disposition': `attachment; filename="${FILENAME}"`,
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
