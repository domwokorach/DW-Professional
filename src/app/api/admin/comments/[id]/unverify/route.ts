import { handleVerification } from '@/lib/admin/moderate.server';

export const dynamic = 'force-dynamic';

/** Admin only (session + CSRF): remove a comment's verification (the comment stays published). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleVerification(request, (await params).id, false);
}
