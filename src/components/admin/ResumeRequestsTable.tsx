'use client';

import { useEffect, useMemo, useState } from 'react';
import { DISPLAY_STATUSES, displayStatus, type DisplayStatus } from '@/lib/resume-access';
import type { AdminResume } from '@/lib/resume-store.server';

// e.g. "06 Oct 2026, 11:45" (UK time).
const WHEN = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
const fmt = (iso: string | null) => (iso ? <time dateTime={iso}>{WHEN.format(new Date(iso))}</time> : <span className="rq-dash">—</span>);

type SortKey = 'activity' | 'requested' | 'company' | 'name' | 'status' | 'downloads';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'activity', label: 'Last activity' }, { key: 'requested', label: 'Requested' }, { key: 'company', label: 'Company A–Z' },
  { key: 'name', label: 'Name A–Z' }, { key: 'status', label: 'Status' }, { key: 'downloads', label: 'Most downloads' },
];

/**
 * Admin → Sessions → Résumé requests. Each request appears by itself (no approval step); the list re-syncs when the
 * server sends new rows (AdminAutoRefresh). Filtering, searching and sorting happen in the browser on the loaded rows.
 */
export default function ResumeRequestsTable({ initialRows, initialTotal }: { initialRows: AdminResume[]; initialTotal: number }) {
  const [rows, setRows] = useState(initialRows);
  useEffect(() => setRows(initialRows), [initialRows]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<DisplayStatus | 'All'>('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<SortKey>('activity');

  const view = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    const start = from ? Date.parse(`${from}T00:00:00`) : null;
    const end = to ? Date.parse(`${to}T23:59:59`) : null;
    const withStatus = rows.map((r) => ({ r, s: displayStatus(r.status, r.expiresAt, now) }));
    const list = withStatus.filter(({ r, s }) => {
      if (status !== 'All' && s !== status) return false;
      const t = Date.parse(r.createdAt);
      if ((start && t < start) || (end && t > end)) return false;
      return !q || [r.fullName, r.email, r.company, r.companyNumber ?? '', r.ipAddress ?? ''].some((v) => v.toLowerCase().includes(q));
    });
    const order = (a: (typeof list)[number], b: (typeof list)[number]) => {
      switch (sort) {
        case 'requested': return Date.parse(b.r.createdAt) - Date.parse(a.r.createdAt);
        case 'company': return a.r.company.localeCompare(b.r.company);
        case 'name': return a.r.fullName.localeCompare(b.r.fullName);
        case 'status': return DISPLAY_STATUSES.indexOf(a.s) - DISPLAY_STATUSES.indexOf(b.s);
        case 'downloads': return b.r.downloadCount - a.r.downloadCount;
        default: return Date.parse(b.r.lastActivityAt) - Date.parse(a.r.lastActivityAt);
      }
    };
    return list.sort(order);
  }, [rows, query, status, from, to, sort]);

  const counts = useMemo(() => {
    const now = Date.now();
    const c: Record<string, number> = {};
    rows.forEach((r) => { const s = displayStatus(r.status, r.expiresAt, now); c[s] = (c[s] ?? 0) + 1; });
    return c;
  }, [rows]);

  return (
    <section className="rq" aria-labelledby="rq-heading">
      <div className="rq-head">
        <div>
          <p className="adm-kicker">RESUME DOWNLOADS</p>
          <h2 className="rq-title" id="rq-heading">Résumé requests</h2>
          <p className="adm-subtitle">Visitors who verified their email to download the résumé. No approval needed; this is the activity record.</p>
        </div>
        <p className="rq-count" role="status">{view.length} of {initialTotal} shown</p>
      </div>

      <div className="rq-controls">
        <label className="rq-control rq-control--grow"><span>Search</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email, company, number or IP" />
        </label>
        <label className="rq-control"><span>From</span><input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="rq-control"><span>To</span><input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        <label className="rq-control"><span>Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>{SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        </label>
      </div>

      <div className="adm-filters" role="group" aria-label="Filter by status">
        {(['All', ...DISPLAY_STATUSES] as const).map((s) => (
          <button key={s} type="button" className="adm-filter" aria-pressed={status === s} onClick={() => setStatus(s)}>
            {s}<span className="adm-filter__count">{s === 'All' ? rows.length : counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {view.length === 0 ? (
        <p className="adm-empty">{rows.length === 0 ? 'No résumé requests yet.' : 'No requests match these filters.'}</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table rq-table">
            <caption className="sr-only">Résumé requests</caption>
            <thead>
              <tr>
                <th scope="col">Candidate</th><th scope="col">Status</th><th scope="col">Requested</th><th scope="col">Verified</th>
                <th scope="col">Downloaded</th><th scope="col">Access</th><th scope="col">Last activity</th><th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {view.map(({ r, s }) => (
                <tr key={r.id}>
                  <th scope="row" data-label="Candidate">
                    {r.fullName}
                    <span className="rq-sub"><a href={`mailto:${r.email}`}>{r.email}</a></span>
                    <span className="rq-sub">{r.company}</span>
                    {r.companyNumber ? (
                      <span className="rq-sub">
                        Company no. {r.companyNumber}{r.companyStatus ? ` · ${r.companyStatus}` : ''}
                        {r.companyLocation && <span className="rq-sub rq-sub--addr">{r.companyLocation}</span>}
                      </span>
                    ) : null}
                    <span className="rq-source" data-source={r.companySource}>
                      {r.companySource === 'companies_house' ? <>Companies House · Live{r.companyVerifiedAt && <> · <time dateTime={r.companyVerifiedAt}>{WHEN.format(new Date(r.companyVerifiedAt))}</time></>}</>
                        : r.companySource === 'company_database' ? 'Company database · Cached (not checked live)' : 'Entered manually'}
                    </span>
                  </th>
                  <td data-label="Status"><span className="rq-status" data-status={s.toLowerCase().replace(/\s/g, '-')}>{s}</span></td>
                  <td data-label="Requested">{fmt(r.createdAt)}</td>
                  <td data-label="Verified">{fmt(r.verifiedAt)}</td>
                  <td data-label="Downloaded">{fmt(r.lastDownloadedAt)}<span className="rq-sub">{r.downloadCount} download{r.downloadCount === 1 ? '' : 's'}</span></td>
                  <td data-label="Access">
                    {[r.deviceType, r.os, r.browser].filter(Boolean).join(' · ') || 'Unknown'}
                    <span className="rq-sub">{r.deviceModel ?? 'Unknown device model'}</span>
                    <span className="rq-sub">IP {r.ipAddress ?? 'not available'}</span>
                  </td>
                  <td data-label="Last activity">{fmt(r.lastActivityAt)}</td>
                  <td data-label="Source">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
