import { audit } from '@/lib/admin/audit.server';
import { requireAdminSession } from '@/lib/admin/session.server';
import { deleteAccess } from '@/lib/portfolio-access-store.server';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

/** Admin only (session + CSRF): permanently deletes one Portfolio Access submission. The audit log keeps the id. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession(request, { csrf: true });
  if (auth instanceof Response) return auth;
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
  try {
    const result = await deleteAccess(id);
    if (result === 'not_found') return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
    await audit('PORTFOLIO_ACCESS_DELETED', { adminUserId: auth.admin.id, portfolioAccessId: id, request });
    return Response.json({ ok: true }, { headers: noStore });
  } catch (err) {
    console.error('[admin-portfolio-access] Delete failed:', (err as Error).name, (err as { code?: string }).code);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: noStore });
  }
}
