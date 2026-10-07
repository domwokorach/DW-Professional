import { clearCookie, IDENTITY_COOKIE } from '@/lib/linkedin.server';
import { isSameOrigin } from '@/lib/request.server';

export const dynamic = 'force-dynamic';

/** POST → forgets the connected LinkedIn identity before the form is submitted (nothing was stored yet). */
export function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'invalid_request' }, { status: 403 });
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store', 'Set-Cookie': clearCookie(IDENTITY_COOKIE, '/api') } });
}
