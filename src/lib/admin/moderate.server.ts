// Server-only: shared handlers for the approve / reject, verify / unverify and italic / unitalic moderation endpoints.
import { audit } from '@/lib/admin/audit.server';
import { requireAdminSession } from '@/lib/admin/session.server';
import { moderateComment, setCommentItalic, setCommentVerified } from '@/lib/comment-store.server';

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

/** Verify / unverify: admin session + CSRF only. 409 if the comment isn't approved or already in that state. */
export async function handleVerification(request: Request, id: string, verified: boolean) {
  const auth = await requireAdminSession(request, { csrf: true });
  if (auth instanceof Response) return auth;
  if (!ID.test(id)) return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
  try {
    const result = await setCommentVerified(id, verified, auth.admin.id);
    if (result === 'not_found') return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
    if (result === 'unchanged') return Response.json({ error: 'invalid_transition' }, { status: 409, headers: noStore });
    await audit(verified ? 'COMMENT_VERIFIED' : 'COMMENT_UNVERIFIED', { adminUserId: auth.admin.id, commentId: id, request });
    return Response.json({ ok: true, isVerified: verified }, { headers: noStore });
  } catch (err) {
    console.error('[admin-comments] Verification failed:', (err as Error).name);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: noStore });
  }
}

/** Italic / upright: admin session + CSRF only. 409 if the comment is already in that state. */
export async function handleItalic(request: Request, id: string, italic: boolean) {
  const auth = await requireAdminSession(request, { csrf: true });
  if (auth instanceof Response) return auth;
  if (!ID.test(id)) return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
  try {
    const result = await setCommentItalic(id, italic);
    if (result === 'not_found') return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
    if (result === 'unchanged') return Response.json({ error: 'invalid_transition' }, { status: 409, headers: noStore });
    await audit(italic ? 'COMMENT_ITALIC_ON' : 'COMMENT_ITALIC_OFF', { adminUserId: auth.admin.id, commentId: id, request });
    return Response.json({ ok: true, isItalic: italic }, { headers: noStore });
  } catch (err) {
    console.error('[admin-comments] Italic change failed:', (err as Error).name);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: noStore });
  }
}
