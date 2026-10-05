'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminComment } from '@/lib/comment-store.server';
import type { CommentStatusValue } from '@/lib/comments';
import VerifiedBadge from '@/components/comments/VerifiedBadge';

type Counts = Record<CommentStatusValue, number>;
type Filter = 'pending' | 'approved' | 'rejected';
type Action = 'approve' | 'reject' | 'delete' | 'verify' | 'unverify';

const FILTERS: { key: Filter; status: CommentStatusValue; label: string }[] = [
  { key: 'pending', status: 'PENDING', label: 'Pending' },
  { key: 'approved', status: 'APPROVED', label: 'Approved' },
  { key: 'rejected', status: 'REJECTED', label: 'Rejected' },
];
const STATUS_LABEL: Record<CommentStatusValue, string> = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected' };
const WHEN = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London' });
const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => Array.from(w)[0]?.toUpperCase() ?? '').join('') || '?';

const EXPIRED_URL = '/admin/login?expired=1&next=%2Fadmin%2Fcomments';

/**
 * The private moderation dashboard. Every request carries the session cookie (HttpOnly, sent by the browser)
 * and state-changing ones also send the CSRF token; the server authorises each one independently. A 401 means
 * the session ended, so the page goes back to sign-in with the "expired" message.
 */
export default function ModerationDashboard({
  adminEmail,
  csrfToken,
  initial,
}: {
  adminEmail: string;
  csrfToken: string;
  initial: { comments: AdminComment[]; counts: Counts } | null;
}) {
  const [filter, setFilter] = useState<Filter>('pending');
  const [comments, setComments] = useState<AdminComment[] | null>(initial?.comments ?? null);
  const [counts, setCounts] = useState<Counts>(initial?.counts ?? { PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [loadError, setLoadError] = useState(!initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminComment | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement | null>(null);
  const firstLoad = useRef(true);

  const handleAuthFailure = useCallback((res: Response) => {
    if (res.status === 401) {
      window.location.assign(EXPIRED_URL);
      return true;
    }
    if (res.status === 403) {
      setNotice({ kind: 'err', text: 'This request could not be verified. Please reload the page and try again.' });
      return true;
    }
    return false;
  }, []);

  const load = useCallback(async (which: Filter) => {
    setComments(null);
    setLoadError(false);
    try {
      const res = await fetch(`/api/admin/comments?status=${which}`, { cache: 'no-store', credentials: 'same-origin' });
      if (handleAuthFailure(res)) return;
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { comments: AdminComment[]; counts: Counts };
      setComments(data.comments);
      setCounts(data.counts);
    } catch {
      setComments([]);
      setLoadError(true);
    }
  }, [handleAuthFailure]);

  useEffect(() => {
    if (firstLoad.current && initial) { firstLoad.current = false; return; }
    firstLoad.current = false;
    load(filter);
  }, [filter, load, initial]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (confirmDelete && !d.open) d.showModal();
    if (!confirmDelete && d.open) d.close();
  }, [confirmDelete]);

  const act = async (comment: AdminComment, action: Action) => {
    if (busyId) return;
    setBusyId(comment.id);
    setNotice(null);
    const url = action === 'delete' ? `/api/admin/comments/${encodeURIComponent(comment.id)}` : `/api/admin/comments/${encodeURIComponent(comment.id)}/${action}`;
    try {
      const res = await fetch(url, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'x-csrf-token': csrfToken },
        credentials: 'same-origin',
      });
      if (handleAuthFailure(res)) return;
      if (res.status === 404 || res.status === 409) {
        setNotice({ kind: 'err', text: 'That comment has already changed. The list has been refreshed.' });
        await load(filter);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      if (action === 'verify' || action === 'unverify') {
        // Verification doesn't change the status, so the comment stays in this list, updated in place.
        const isVerified = action === 'verify';
        setComments((list) => list?.map((c) => (c.id === comment.id
          ? { ...c, isVerified, verifiedAt: isVerified ? new Date().toISOString() : null, verifiedBy: isVerified ? adminEmail : null }
          : c)) ?? list);
        setNotice({
          kind: 'ok',
          text: isVerified
            ? `Verified. ${comment.fullName}'s comment now shows the verified badge.`
            : `Verification removed. ${comment.fullName}'s comment stays public without the badge.`,
        });
        return;
      }
      const from = comment.status;
      setComments((list) => list?.filter((c) => c.id !== comment.id) ?? list);
      setCounts((c) => {
        const next = { ...c, [from]: Math.max(0, c[from] - 1) };
        if (action === 'approve') next.APPROVED += 1;
        if (action === 'reject') next.REJECTED += 1;
        return next;
      });
      setNotice({
        kind: 'ok',
        text:
          action === 'approve' ? `Approved. ${comment.fullName}'s comment is now public.`
          : action === 'reject' ? `Rejected. ${comment.fullName}'s comment is private.`
          : `Deleted ${comment.fullName}'s comment permanently.`,
      });
    } catch {
      setNotice({ kind: 'err', text: 'That action failed. Please try again.' });
    } finally {
      setBusyId(null);
    }
  };

  const closeDialog = () => {
    setConfirmDelete(null);
    deleteTrigger.current?.focus();
  };

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST', headers: { 'x-csrf-token': csrfToken }, credentials: 'same-origin' });
    } finally {
      // Whatever the response, the cookie is cleared server-side for any valid session; leave the admin area.
      window.location.assign('/admin/login');
    }
  };

  const active = FILTERS.find((f) => f.key === filter)!;

  return (
    <main className="adm-dash" id="main">
      <header className="adm-bar">
        <div>
          <p className="adm-kicker">PORTFOLIO ADMIN</p>
          <h1 className="adm-title">Comment moderation</h1>
        </div>
        <div className="adm-bar__user">
          <span className="adm-who" title={adminEmail}>Signed in as <strong>{adminEmail}</strong></span>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={logout} disabled={loggingOut}>
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </header>

      <nav className="adm-filters" aria-label="Filter comments by status">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className="adm-filter"
            aria-pressed={filter === f.key}
            onClick={() => { setNotice(null); setFilter(f.key); }}
          >
            {f.label} <span className="adm-filter__count">{counts[f.status]}</span>
          </button>
        ))}
      </nav>

      <div className="adm-notice-wrap" aria-live="polite">
        {notice && <p className={notice.kind === 'ok' ? 'adm-notice' : 'adm-notice adm-notice--err'}>{notice.text}</p>}
      </div>

      <section aria-labelledby="adm-list-title" aria-busy={comments === null}>
        <h2 id="adm-list-title" className="sr-only">{active.label} comments</h2>
        {comments === null ? (
          <p className="adm-empty">Loading…</p>
        ) : loadError ? (
          <p className="adm-empty adm-empty--err">Comments could not be loaded. <button type="button" className="cm-link" onClick={() => load(filter)}>Try again</button></p>
        ) : comments.length === 0 ? (
          <p className="adm-empty">No {active.label.toLowerCase()} comments.</p>
        ) : (
          <ul className="adm-list">
            {comments.map((c) => {
              const busy = busyId === c.id;
              return (
                <li key={c.id}>
                  <article className="adm-card adm-item" aria-labelledby={`adm-c-${c.id}`}>
                    <header className="adm-item__head">
                      <span className="cm-avatar-wrap">
                        <span className="cm-avatar cm-avatar--lg" aria-hidden="true">
                          {c.avatarUrl ? <img src={c.avatarUrl} alt="" /> : initials(c.fullName)}
                        </span>
                        {c.isVerified && <VerifiedBadge />}
                      </span>
                      <div className="adm-item__who">
                        <h3 id={`adm-c-${c.id}`} className="cm-name">{c.fullName}</h3>
                        <p className="cm-role">{c.company || 'No company given'}</p>
                      </div>
                      <span className={`adm-status adm-status--${c.status.toLowerCase()}`}>{STATUS_LABEL[c.status]}</span>
                    </header>

                    <blockquote className="cm-text">{c.comment}</blockquote>

                    <dl className="adm-meta">
                      <div><dt>Email</dt><dd><a href={`mailto:${encodeURIComponent(c.email).replace('%40', '@')}`}>{c.email}</a></dd></div>
                      <div><dt>Submitted</dt><dd><time dateTime={c.createdAt}>{WHEN.format(new Date(c.createdAt))}</time></dd></div>
                      <div><dt>Device / platform</dt><dd>{c.device ?? 'Unknown'}</dd></div>
                      <div><dt>IP address</dt><dd>{c.ipAddress ?? 'Unknown'}</dd></div>
                      <div><dt>Avatar</dt><dd>{c.avatarUrl ? 'Uploaded' : 'None'}</dd></div>
                      <div><dt>Consent</dt><dd>Given {WHEN.format(new Date(c.consentGivenAt))}</dd></div>
                      {c.notificationStatus === 'FAILED' && <div><dt>Email alert</dt><dd>Not delivered</dd></div>}
                      {c.status === 'APPROVED' && (
                        <div>
                          <dt>Verification</dt>
                          <dd>
                            {c.isVerified && c.verifiedAt
                              ? `Verified ${WHEN.format(new Date(c.verifiedAt))}${c.verifiedBy ? ` by ${c.verifiedBy}` : ''}`
                              : 'Not verified (no badge)'}
                          </dd>
                        </div>
                      )}
                      {c.moderatedAt && (
                        <div><dt>Last moderated</dt><dd>{WHEN.format(new Date(c.moderatedAt))}{c.moderatedBy ? ` by ${c.moderatedBy}` : ''}</dd></div>
                      )}
                    </dl>

                    <div className="adm-actions">
                      {c.status !== 'APPROVED' && (
                        <button type="button" className="adm-btn" onClick={() => act(c, 'approve')} disabled={busy}>
                          {busy ? 'Working…' : 'Approve'}
                        </button>
                      )}
                      {c.status === 'APPROVED' && (
                        <button type="button" className="adm-btn adm-btn--ghost" onClick={() => act(c, c.isVerified ? 'unverify' : 'verify')} disabled={busy}>
                          {c.isVerified ? 'Remove verification' : 'Mark as verified'}
                        </button>
                      )}
                      {c.status !== 'REJECTED' && (
                        <button type="button" className="adm-btn adm-btn--ghost" onClick={() => act(c, 'reject')} disabled={busy}>
                          {c.status === 'APPROVED' ? 'Reject (unpublish)' : 'Reject'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="adm-btn adm-btn--danger"
                        disabled={busy}
                        onClick={(e) => { deleteTrigger.current = e.currentTarget; setConfirmDelete(c); }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <dialog ref={dialog} className="adm-dialog" aria-labelledby="adm-dialog-title" aria-describedby="adm-dialog-desc" onClose={() => confirmDelete && closeDialog()}>
        <h2 id="adm-dialog-title" className="adm-dialog__title">Delete comment</h2>
        <p id="adm-dialog-desc">Are you sure you want to permanently delete this comment?</p>
        {confirmDelete && <p className="adm-dialog__who">{confirmDelete.fullName}{confirmDelete.company ? ` · ${confirmDelete.company}` : ''}</p>}
        <div className="adm-actions">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={closeDialog} autoFocus>Cancel</button>
          <button
            type="button"
            className="adm-btn adm-btn--danger"
            onClick={() => {
              const target = confirmDelete;
              setConfirmDelete(null);
              if (target) act(target, 'delete');
            }}
          >
            Delete permanently
          </button>
        </div>
      </dialog>
    </main>
  );
}
