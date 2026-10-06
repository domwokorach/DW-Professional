import type { AdminAccess } from '@/lib/portfolio-access-store.server';

// e.g. "06 Oct 2026, 11:45" (UK time).
const WHEN = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
});
const telHref = (mobile: string) => `tel:${mobile.trim().startsWith('+') ? '+' : ''}${mobile.replace(/\D/g, '')}`;

/**
 * Portfolio Access submissions, newest first. A real table on wide screens; below 760px each row becomes a card with
 * its column names shown beside the values (data-label), so nothing scrolls sideways on a phone.
 */
export default function PortfolioAccessTable({ rows }: { rows: AdminAccess[] }) {
  return (
    <div className="adm-card adm-table-wrap">
      <table className="adm-table">
        <caption className="sr-only">Portfolio Access submissions, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Full Name</th>
            <th scope="col">Email</th>
            <th scope="col">Mobile</th>
            <th scope="col">Company</th>
            <th scope="col">IP Address</th>
            <th scope="col" aria-sort="descending">Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {/* One wrapper per cell, so the phone layout's label + value grid keeps multi-part values together. */}
              <th scope="row" data-label="Full Name">
                <span>
                  {r.fullName}
                  {r.notificationStatus === 'FAILED' && <span className="adm-tag adm-tag--warn">Email not sent</span>}
                </span>
              </th>
              <td data-label="Email"><span><a href={`mailto:${r.email}`}>{r.email}</a></span></td>
              <td data-label="Mobile"><span><a href={telHref(r.mobile)}>{r.mobile}</a></span></td>
              <td data-label="Company">
                <span>
                  {r.company || <span className="adm-muted">—</span>}
                  {r.company && r.companyNumber && <span className="adm-sub">Company no. {r.companyNumber}</span>}
                </span>
              </td>
              <td data-label="IP Address" className="adm-mono">
                <span>{r.ipAddress ?? <span className="adm-muted">Not available</span>}</span>
              </td>
              <td data-label="Submitted At"><span><time dateTime={r.createdAt}>{WHEN.format(new Date(r.createdAt))}</time></span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
