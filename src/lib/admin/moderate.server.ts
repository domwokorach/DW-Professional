// Server-only: shared handler for the approve / reject moderation endpoints.
import { audit } from '@/lib/admin/audit.server';
import { requireAdminSession } from '@/lib/admin/session.server';
import { moderateComment } from '@/lib/comment-store.server';

const ID = /^[a-z0-9]{20,40}$/;
const noStore = { 'Cache-Control': 'no-store' };

export async function handleModeration(request: Request, id: string, to: 'APPROVED' | 'REJECTED') {
  const auth = await requireAdminSession(request, { csrf: true });
  if (auth instanceof Response) return auth;
  if (!ID.test(id)) return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
  try {
    const result = await moderateComment(id, to, auth.admin.id);
    if (result === 'not_found') return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
    if (result === 'unchanged') return Response.json({ error: 'invalid_transition' }, { status: 409, headers: noStore });
    await audit(to === 'APPROVED' ? 'COMMENT_APPROVED' : 'COMMENT_REJECTED', { adminUserId: auth.admin.id, commentId: id, request });
    return Response.json({ ok: true, status: to }, { headers: noStore });
  } catch (err) {
    console.error('[admin-comments] Moderation failed:', (err as Error).name);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: noStore });
  }
}
