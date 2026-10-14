'use client';

import { useEffect, useRef, useState } from 'react';
import { RESUME_DOWNLOAD_FILENAME } from '@/lib/resume-access';

export const RESUME_DOWNLOAD_PATH = '/api/resume/download';

export type DownloadResult = { ok: true } | { ok: false; message: string };

/**
 * Fetches the PDF first, so a JSON/HTML error response is never saved as a "download.json" file:
 * only a 200 application/pdf body starting with %PDF- is handed to the browser, under a .pdf name.
 */
export async function startResumeDownload(): Promise<DownloadResult> {
  try {
    const res = await fetch(RESUME_DOWNLOAD_PATH, { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 403) return { ok: false, message: 'Your download link has expired. Please verify your email again to download the résumé.' };
      return { ok: false, message: 'The résumé is temporarily unavailable. Please try again shortly.' };
    }
    const blob = await res.blob();
    const signature = await blob.slice(0, 5).text();
    if (!(res.headers.get('content-type') ?? '').includes('application/pdf') || signature !== '%PDF-') {
      return { ok: false, message: 'The résumé could not be downloaded. Please try again shortly.' };
    }
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = RESUME_DOWNLOAD_FILENAME;
    a.rel = 'noopener';
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return { ok: true };
  } catch {
    return { ok: false, message: 'Network problem: the résumé could not be downloaded. Check your connection and try again.' };
  }
}

/** Step 3/4: verified, the download starts by itself, and a visible button covers browsers that block it. */
export default function VerifiedPanel({ headingRef }: { headingRef?: React.Ref<HTMLHeadingElement> }) {
  const started = useRef(false);
  const [state, setState] = useState<'starting' | 'done' | 'error'>('starting');
  const [error, setError] = useState('');

  const download = async () => {
    setState('starting');
    const result = await startResumeDownload();
    if (result.ok) setState('done');
    else { setError(result.message); setState('error'); }
  };

  useEffect(() => {
    if (started.current) return; // Strict Mode runs effects twice in development; download once.
    started.current = true;
    void download();
  }, []);

  return (
    <div className="rs-panel rs-panel--done">
      <div className="rs-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </div>
      <h2 className="rs-title" tabIndex={-1} ref={headingRef}>Email Verified Successfully</h2>
      <p className="rs-text" role="status">
        {state === 'starting' ? 'Your résumé download is starting…' : state === 'error' ? error : 'If the download did not start, use the button below.'}
      </p>
      <a
        className="rs-btn rs-btn--primary"
        href={RESUME_DOWNLOAD_PATH}
        download={RESUME_DOWNLOAD_FILENAME}
        onClick={(e) => { e.preventDefault(); void download(); }}
      >
        Download Resume
      </a>
      <p className="rs-note">This download link works for 15 minutes in this browser.</p>
    </div>
  );
}
