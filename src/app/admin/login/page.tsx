import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin';
import { getAdminSession, safeNext } from '@/lib/admin/session.server';

type Search = Promise<{ next?: string | string[]; expired?: string | string[] }>;

/** Admin sign-in. Separate from everything candidate-facing; already signed-in admins go straight on. */
export default async function AdminLoginPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const next = safeNext(Array.isArray(params.next) ? params.next[0] : params.next);
  const session = await getAdminSession();
  if (session.ok) redirect(next);
  // Shown when a protected page or request found an expired, idle or revoked session.
  const expired = params.expired === '1' || session.reason === 'expired';
  return (
    <main className="adm-login" id="main">
      <AdminLoginForm next={next} expired={expired} />
      <p className="adm-help">Admin credentials are configured during project setup.</p>
    </main>
  );
}
