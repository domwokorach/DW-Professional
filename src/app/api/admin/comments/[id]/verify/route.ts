import { handleVerification } from '@/lib/admin/moderate.server';

export const dynamic = 'force-dynamic';

/** Admin only (session + CSRF): mark an approved comment as verified (shows the badge on its avatar). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleVerification(request, (await params).id, true);
}
