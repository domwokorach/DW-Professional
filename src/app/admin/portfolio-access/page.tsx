import Link from 'next/link';
import { AdminLogoutButton, AdminSections, PortfolioAccessTable } from '@/components/admin';
import { requireAdminPage } from '@/lib/admin/session.server';
import { ADMIN_PORTFOLIO_ACCESS_PATH, listAccessForAdmin, type AdminAccess } from '@/lib/portfolio-access-store.server';

// Rendered per request (see also the admin layout), so a new submission shows on the next load or refresh.
export const dynamic = 'force-dynamic';

/** Private list of Portfolio Access submissions. The session is validated on the server before anything is read. */
export default async function AdminPortfolioAccessPage() {
  const session = await requireAdminPage(ADMIN_PORTFOLIO_ACCESS_PATH);
  let data: { rows: AdminAccess[]; total: number } | null = null;
  try {
    data = await listAccessForAdmin();
  } catch (err) {
    console.error('[admin-portfolio-access] Could not load submissions:', (err as Error).name, (err as { code?: string }).code);
  }

  return (
    <main className="adm-dash adm-dash--wide" id="main">
      <header className="adm-bar">
        <div>
          <p className="adm-kicker">PORTFOLIO ADMIN</p>
          <h1 className="adm-title">Portfolio Access</h1>
        </div>
        <div className="adm-bar__user">
          <span className="adm-who" title={session.admin.email}>Signed in as <strong>{session.admin.email}</strong></span>
          <AdminLogoutButton csrfToken={session.csrfToken} />
        </div>
      </header>

      <AdminSections current={ADMIN_PORTFOLIO_ACCESS_PATH} />

      {data === null ? (
        <p className="adm-empty adm-empty--err">Submissions could not be loaded. <Link href={ADMIN_PORTFOLIO_ACCESS_PATH} className="cm-link">Try again</Link></p>
      ) : data.rows.length === 0 ? (
        <p className="adm-empty">No Portfolio Access submissions yet.</p>
      ) : (
        <section aria-labelledby="adm-pa-title" className="adm-pa">
          <div className="adm-pa__head">
            <h2 id="adm-pa-title" className="adm-pa__count">
              {data.total} {data.total === 1 ? 'submission' : 'submissions'}
              {data.total > data.rows.length && <span className="adm-muted"> · showing the latest {data.rows.length}</span>}
            </h2>
            <Link href={ADMIN_PORTFOLIO_ACCESS_PATH} className="adm-btn adm-btn--ghost" prefetch={false}>Refresh</Link>
          </div>
          <PortfolioAccessTable rows={data.rows} />
        </section>
      )}
    </main>
  );
}
