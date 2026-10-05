import { handleModeration } from '@/lib/admin/moderate.server';

export const dynamic = 'force-dynamic';

/** Admin only (session + CSRF): approve a comment. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleModeration(request, (await params).id, 'APPROVED');
}
