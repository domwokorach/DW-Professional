import { requireAdminSession } from '@/lib/admin/session.server';
import { deleteResumeRequest } from '@/lib/resume-store.server';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

/** Admin only (session + CSRF): permanently deletes one résumé request and its events. The résumé PDF is untouched. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession(request, { csrf: true });
  if (auth instanceof Response) return auth;
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
  try {
    const result = await deleteResumeRequest(id);
    if (result === 'not_found') return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
    return Response.json({ ok: true }, { headers: noStore });
  } catch (err) {
    console.error('[admin-resume] Delete failed:', (err as Error).name, (err as { code?: string }).code);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: noStore });
  }
}
