import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminAutoRefresh, AdminLogoutButton, AdminSections, SessionFiles } from '@/components/admin';
import { ThemeToggle } from '@/components/layout';
import { requireAdminPage } from '@/lib/admin/session.server';
import {
  ADMIN_PORTFOLIO_ACCESS_PATH, adminSessionPath, getAccessForAdmin, type AdminSession,
} from '@/lib/portfolio-access-store.server';

export const dynamic = 'force-dynamic';

// e.g. "06 Oct 2026, 11:45" (UK time).
const WHEN = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
});
const telHref = (mobile: string) => `tel:${mobile.trim().startsWith('+') ? '+' : ''}${mobile.replace(/\D/g, '')}`;
const EMAIL_STATUS = { SENT: 'Notification sent', FAILED: 'Notification email not sent', PENDING: 'Notification pending' } as const;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="adm-dl__row">
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);
const Muted = ({ children }: { children: React.ReactNode }) => <span className="adm-muted">{children}</span>;
const External = ({ href }: { href: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{href.replace(/^https?:\/\//, '').replace(/\/$/, '')}<span className="sr-only"> (opens in a new tab)</span></a>
);

/** Admin → Sessions → one candidate: everything they submitted from /en-gb/portfolio-access, and their files. */
export default async function AdminSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminPage(adminSessionPath(id));
  if (!/^[a-z0-9]{20,40}$/.test(id)) notFound();

  let s: AdminSession | null = null;
  let failed = false;
  try {
    s = await getAccessForAdmin(id);
  } catch (err) {
    failed = true;
    console.error('[admin-sessions] Could not load session:', (err as Error).name, (err as { code?: string }).code);
  }
  if (!failed && !s) notFound();

  return (
    <main className="adm-dash adm-dash--wide adm-dash--access" id="main">
      <header className="adm-bar">
        <div>
          <p className="adm-kicker">PORTFOLIO ACCESS · SESSION</p>
          <h1 className="adm-title">{s?.fullName ?? 'Session'}</h1>
          {s && <p className="adm-subtitle">{s.email}</p>}
        </div>
        <div className="adm-bar__user">
          <span className="adm-who" title={auth.admin.email}>Signed in as <strong>{auth.admin.email}</strong></span>
          <ThemeToggle />
          <AdminLogoutButton csrfToken={auth.csrfToken} />
        </div>
      </header>

      <AdminSections current={ADMIN_PORTFOLIO_ACCESS_PATH} />
      <Link href={ADMIN_PORTFOLIO_ACCESS_PATH} className="adm-back">← All sessions</Link>

      {!s ? (
        <p className="adm-empty adm-empty--err">This session could not be loaded. <Link href={adminSessionPath(id)} className="cm-link">Try again</Link></p>
      ) : (
        <>
          <div className="adm-session">
            <section className="adm-card adm-panel" aria-labelledby="adm-s-candidate">
              <h2 id="adm-s-candidate" className="adm-panel__title">Candidate</h2>
              <dl className="adm-dl">
                <Row label="Full name">{s.fullName}</Row>
                <Row label="Email"><a href={`mailto:${s.email}`}>{s.email}</a></Row>
                <Row label="Mobile"><a href={telHref(s.mobile)}>{s.mobile}</a></Row>
                <Row label="Company">
                  {s.company ?? <Muted>—</Muted>}
                  {s.company && s.companyNumber && <span className="adm-sub">Company no. {s.companyNumber}</span>}
                </Row>
                <Row label="LinkedIn">{s.linkedinUrl ? <External href={s.linkedinUrl} /> : <Muted>—</Muted>}</Row>
                <Row label="Company website">{s.companyWebsite ? <External href={s.companyWebsite} /> : <Muted>—</Muted>}</Row>
                <Row label="Portfolio">{s.portfolioUrl ? <External href={s.portfolioUrl} /> : <Muted>—</Muted>}</Row>
              </dl>
            </section>

            <section className="adm-card adm-panel" aria-labelledby="adm-s-session">
              <h2 id="adm-s-session" className="adm-panel__title">Session</h2>
              <dl className="adm-dl">
                <Row label="Status">
                  <span className={`adm-pill${s.notificationStatus === 'FAILED' ? ' adm-pill--warn' : ''}`}>{EMAIL_STATUS[s.notificationStatus]}</span>
                </Row>
                <Row label="Submissions">{s.submissionCount}</Row>
                <Row label="Last submitted"><time dateTime={s.lastSubmittedAt}>{WHEN.format(new Date(s.lastSubmittedAt))}</time></Row>
                <Row label="First submitted"><time dateTime={s.createdAt}>{WHEN.format(new Date(s.createdAt))}</time></Row>
                <Row label="IP address"><span className="adm-mono">{s.ipAddress ?? 'Not available'}</span></Row>
                <Row label="Device">{s.device ?? <Muted>Unknown</Muted>}</Row>
                <Row label="Browser">{s.userAgent ? <span className="adm-ua">{s.userAgent}</span> : <Muted>Unknown</Muted>}</Row>
                <Row label="Source">{s.source}</Row>
              </dl>
            </section>
          </div>

          <SessionFiles files={s.attachments} candidate={s.fullName} lastSubmittedAt={s.lastSubmittedAt} />
        </>
      )}
      <AdminAutoRefresh />
    </main>
  );
}
