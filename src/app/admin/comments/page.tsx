import { ModerationDashboard } from '@/components/admin';
import { requireAdminPage } from '@/lib/admin/session.server';
import { countCommentsByStatus, listCommentsForAdmin } from '@/lib/comment-store.server';

/** Private moderation dashboard. The session is validated on the server before anything is read. */
export default async function AdminCommentsPage() {
  const session = await requireAdminPage('/admin/comments');
  let initial = null;
  try {
    const [comments, counts] = await Promise.all([listCommentsForAdmin('PENDING'), countCommentsByStatus()]);
    initial = { comments, counts };
  } catch (err) {
    console.error('[admin-comments] Could not load comments:', (err as Error).name);
  }
  return <ModerationDashboard adminEmail={session.admin.email} csrfToken={session.csrfToken} initial={initial} />;
}
