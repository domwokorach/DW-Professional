import { requireAdminSession } from '@/lib/admin/session.server';
import { countCommentsByStatus, listCommentsForAdmin } from '@/lib/comment-store.server';

export const dynamic = 'force-dynamic';

const STATUSES = { pending: 'PENDING', approved: 'APPROVED', rejected: 'REJECTED' } as const;

/** Admin only: comments in one status (with private moderation metadata) plus the count per status. */
export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if (auth instanceof Response) return auth;

  const filter = new URL(request.url).searchParams.get('status') ?? 'pending';
  const status = STATUSES[filter as keyof typeof STATUSES];
  if (!status) return Response.json({ error: 'invalid_status' }, { status: 400 });
  try {
    const [comments, counts] = await Promise.all([listCommentsForAdmin(status), countCommentsByStatus()]);
    return Response.json({ comments, counts }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[admin-comments] Could not list comments:', (err as Error).name);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
