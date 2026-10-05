import { handleItalic } from '@/lib/admin/moderate.server';

export const dynamic = 'force-dynamic';

/** Admin only (session + CSRF): show a comment's text in italics on the public card. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleItalic(request, (await params).id, true);
}
