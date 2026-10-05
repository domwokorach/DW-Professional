import { audit } from '@/lib/admin/audit.server';
import { endAdminSession, requireAdminSession } from '@/lib/admin/session.server';

export const dynamic = 'force-dynamic';

/** Revokes the session on the server and clears the cookie. Needs a valid session and its CSRF token. */
export async function POST(request: Request) {
  const auth = await requireAdminSession(request, { csrf: true });
  if (auth instanceof Response) {
    // Without a valid session there is nothing to revoke; still clear whatever cookie the browser has.
    if (auth.status === 401) await endAdminSession();
    return auth;
  }
  await endAdminSession();
  await audit('LOGOUT', { adminUserId: auth.admin.id, request });
  return Response.json({ ok: true, redirect: '/admin/login' }, { headers: { 'Cache-Control': 'no-store' } });
}
