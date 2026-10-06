import Link from 'next/link';
import { AdminAutoRefresh, AdminLogoutButton, AdminSections, PortfolioAccessTable } from '@/components/admin';
import { ThemeToggle } from '@/components/layout';
import { requireAdminPage } from '@/lib/admin/session.server';
import { ADMIN_PORTFOLIO_ACCESS_PATH, listAccessForAdmin, type AdminAccess } from '@/lib/portfolio-access-store.server';

// Rendered per request (see also the admin layout); AdminAutoRefresh re-renders it while open, so new submissions appear.
export const dynamic = 'force-dynamic';

/** Admin → Sessions: one row per Portfolio Access candidate. The admin session is validated before anything is read. */
export default async function AdminSessionsPage() {
  const session = await requireAdminPage(ADMIN_PORTFOLIO_ACCESS_PATH);
  let data: { rows: AdminAccess[]; total: number } | null = null;
  try {
    data = await listAccessForAdmin();
  } catch (err) {
    console.error('[admin-sessions] Could not load sessions:', (err as Error).name, (err as { code?: string }).code);
  }

  return (
    <main className="adm-dash adm-dash--wide adm-dash--access" id="main">
      <header className="adm-bar">
        <div>
          <p className="adm-kicker">PORTFOLIO ACCESS</p>
          <h1 className="adm-title">Sessions</h1>
          <p className="adm-subtitle">Candidates who completed the Portfolio Access form.</p>
        </div>
        <div className="adm-bar__user">
          <span className="adm-who" title={session.admin.email}>Signed in as <strong>{session.admin.email}</strong></span>
          {/* The site-wide theme switch: same saved choice and system default as the rest of the site. */}
          <ThemeToggle />
          <AdminLogoutButton csrfToken={session.csrfToken} />
        </div>
      </header>

      <AdminSections current={ADMIN_PORTFOLIO_ACCESS_PATH} />

      {data === null ? (
        <p className="adm-empty adm-empty--err">Sessions could not be loaded. <Link href={ADMIN_PORTFOLIO_ACCESS_PATH} className="cm-link">Try again</Link></p>
      ) : (
        <PortfolioAccessTable initialRows={data.rows} initialTotal={data.total} csrfToken={session.csrfToken} />
      )}
      <AdminAutoRefresh />
    </main>
  );
}
