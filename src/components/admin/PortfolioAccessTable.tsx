'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ADMIN_SESSIONS_PATH as PAGE, adminSessionPath } from '@/lib/portfolio-access';
import type { AdminAccess } from '@/lib/portfolio-access-store.server';

// e.g. "06 Oct 2026, 11:45" (UK time).
const WHEN = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
});
const telHref = (mobile: string) => `tel:${mobile.trim().startsWith('+') ? '+' : ''}${mobile.replace(/\D/g, '')}`;
/** The links a candidate added (validated absolute http(s) URLs on the server), labelled for the table. */
const links = (r: AdminAccess): [string, string][] =>
  ([['LinkedIn', r.linkedinUrl], ['Website', r.companyWebsite], ['Portfolio', r.portfolioUrl]] as [string, string | null][])
    .filter((l): l is [string, string] => Boolean(l[1]));
const EXPIRED_URL = `/admin/login?expired=1&next=${encodeURIComponent(PAGE)}`;

type Notice = { kind: 'ok' | 'err'; text: string };

/**
 * Admin → Sessions: one row per Portfolio Access candidate, most recently submitted first. The name opens the
 * candidate's session page (all details and files). Each row has a Delete action.
 *
 * The list re-syncs whenever the server sends new rows (AdminAutoRefresh), so new submissions appear by themselves.
 * Deleting asks for confirmation in a modal dialog, then sends an authenticated DELETE (session cookie + CSRF token);
 * the row is removed only once the server confirms. One delete at a time: further clicks are ignored while a
 * request is in flight.
 *
 * A real table on wide screens; below 760px each row becomes a card with its column names shown beside the values
 * (data-label), so nothing scrolls sideways on a phone.
 */
export default function PortfolioAccessTable({
  initialRows,
  initialTotal,
  csrfToken,
}: {
  initialRows: AdminAccess[];
  initialTotal: number;
  csrfToken: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  useEffect(() => {
    setRows(initialRows);
    setTotal(initialTotal);
  }, [initialRows, initialTotal]);
  const [confirming, setConfirming] = useState<AdminAccess | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const countHeading = useRef<HTMLHeadingElement>(null);
  // Synchronous guard: state updates are async, so a fast double click could otherwise send two requests.
  const inFlight = useRef(false);
  // Where focus goes once the dialog has closed. Closing a modal dialog returns focus to the element that opened
  // it, which no longer exists after a delete, so focus is moved only after the close.
  const focusAfterClose = useRef<'trigger' | 'heading'>('trigger');

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (confirming && !d.open) d.showModal();
    if (!confirming && d.open) {
      d.close();
      (focusAfterClose.current === 'heading' ? countHeading.current : trigger.current)?.focus();
    }
  }, [confirming]);

  const ask = (row: AdminAccess, button: HTMLButtonElement) => {
    if (inFlight.current) return;
    trigger.current = button;
    setNotice(null);
    setConfirming(row);
  };

  /** Closes the dialog, returning focus to the row's Delete button (or, when the row is gone, the count). */
  const close = (focus: 'trigger' | 'heading') => {
    focusAfterClose.current = focus;
    setConfirming(null);
  };

  const cancel = () => {
    if (!inFlight.current) close('trigger');
  };

  const removeRow = (id: string) => {
    setRows((list) => list.filter((r) => r.id !== id));
    setTotal((n) => Math.max(0, n - 1));
    close('heading');
  };

  const confirmDelete = async () => {
    const row = confirming;
    if (!row || inFlight.current) return;
    inFlight.current = true;
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/portfolio-access/${encodeURIComponent(row.id)}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken },
        credentials: 'same-origin',
      });
      if (res.status === 401) {
        window.location.assign(EXPIRED_URL);
        return;
      }
      if (res.status === 404) {
        removeRow(row.id);
        setNotice({ kind: 'ok', text: `${row.fullName}'s session had already been deleted. It has been removed from the list.` });
        return;
      }
      if (res.status === 403) {
        close('trigger');
        setNotice({ kind: 'err', text: 'This request could not be verified. Please reload the page and try again.' });
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      removeRow(row.id);
      setNotice({ kind: 'ok', text: `Deleted ${row.fullName}'s session and files permanently.` });
    } catch {
      close('trigger');
      setNotice({ kind: 'err', text: `${row.fullName}'s session could not be deleted. Please try again.` });
    } finally {
      inFlight.current = false;
      setDeletingId(null);
    }
  };

  const deleting = deletingId !== null;

  return (
    <section aria-labelledby="adm-pa-title" className="adm-pa">
      <div className="adm-pa__head">
        <h2 id="adm-pa-title" className="adm-pa__count" ref={countHeading} tabIndex={-1}>
          {total} {total === 1 ? 'session' : 'sessions'}
          {total > rows.length && <span className="adm-muted"> · showing the latest {rows.length}</span>}
        </h2>
        <Link href={PAGE} className="adm-btn adm-btn--ghost" prefetch={false}>Refresh</Link>
      </div>

      <div className="adm-notice-wrap" aria-live="polite">
        {notice && <p className={notice.kind === 'ok' ? 'adm-notice' : 'adm-notice adm-notice--err'} role={notice.kind === 'err' ? 'alert' : undefined}>{notice.text}</p>}
      </div>

      {rows.length === 0 ? (
        <p className="adm-empty">No sessions yet. They appear here when a candidate submits the Portfolio Access form.</p>
      ) : (
        <div className="adm-card adm-table-wrap">
          <table className="adm-table">
            <caption className="sr-only">Portfolio Access sessions, most recently submitted first</caption>
            <thead>
              <tr>
                <th scope="col">Full Name</th>
                <th scope="col">Email</th>
                <th scope="col">Mobile</th>
                <th scope="col">Company</th>
                <th scope="col">Links</th>
                <th scope="col">IP Address</th>
                <th scope="col" aria-sort="descending">Last Submitted</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {/* One wrapper per cell, so the phone layout's label + value grid keeps multi-part values together. */}
                  <th scope="row" data-label="Full Name">
                    <span>
                      <Link href={adminSessionPath(r.id)} className="adm-name-link">{r.fullName}</Link>
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
                  <td data-label="Links">
                    <span>
                      {links(r).length || r.attachments.length ? (
                        <span className="adm-links">
                          {links(r).map(([label, href]) => (
                            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${r.fullName}'s ${label} (opens in a new tab)`}>
                              {label}
                            </a>
                          ))}
                          {r.attachments.length > 0 && (
                            <Link href={`${adminSessionPath(r.id)}#files`} aria-label={`${r.fullName}'s files: ${r.attachments.length}. Open the session.`}>
                              {r.attachments.length === 1 ? '1 file' : `${r.attachments.length} files`}
                            </Link>
                          )}
                        </span>
                      ) : <span className="adm-muted">—</span>}
                    </span>
                  </td>
                  <td data-label="IP Address" className="adm-mono">
                    <span>{r.ipAddress ?? <span className="adm-muted">Not available</span>}</span>
                  </td>
                  <td data-label="Last Submitted">
                    <span>
                      <time dateTime={r.lastSubmittedAt}>{WHEN.format(new Date(r.lastSubmittedAt))}</time>
                      {r.submissionCount > 1 && <span className="adm-sub">{r.submissionCount} submissions</span>}
                    </span>
                  </td>
                  <td className="adm-table__actions">
                    <Link href={adminSessionPath(r.id)} className="adm-btn adm-btn--ghost adm-btn--sm" aria-label={`Open ${r.fullName}'s session`}>
                      Open
                    </Link>
                    <button
                      type="button"
                      className="adm-btn adm-btn--danger adm-btn--sm"
                      onClick={(e) => ask(r, e.currentTarget)}
                      disabled={deleting}
                      aria-label={`Delete ${r.fullName}'s session`}
                    >
                      {deletingId === r.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Same confirmation pattern as comment deletion. Escape / Cancel close it unless a delete is in flight. */}
      <dialog
        ref={dialog}
        className="adm-dialog"
        aria-labelledby="adm-pa-dialog-title"
        aria-describedby="adm-pa-dialog-desc"
        onCancel={(e) => { e.preventDefault(); cancel(); }}
      >
        <h2 id="adm-pa-dialog-title" className="adm-dialog__title">Delete session</h2>
        <p id="adm-pa-dialog-desc">This permanently removes the candidate&apos;s session and any files they sent. It can&apos;t be undone.</p>
        {confirming && (
          <p className="adm-dialog__who">
            {confirming.fullName} · {confirming.email}
            <span className="adm-sub">{WHEN.format(new Date(confirming.createdAt))}</span>
          </p>
        )}
        <div className="adm-actions">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={cancel} disabled={deleting} autoFocus>Cancel</button>
          <button type="button" className="adm-btn adm-btn--danger" onClick={confirmDelete} disabled={deleting} aria-busy={deleting || undefined}>
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </dialog>
    </section>
  );
}
