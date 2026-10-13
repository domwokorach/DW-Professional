'use client';

import { useEffect, useRef, useState } from 'react';

export const RESUME_DOWNLOAD_PATH = '/api/resume/download';

/** Starts the download without leaving the page (the response is an attachment). Returns false if it can't be triggered. */
export function startResumeDownload(): boolean {
  try {
    const a = document.createElement('a');
    a.href = RESUME_DOWNLOAD_PATH;
    a.download = '';
    a.rel = 'noopener';
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    return false;
  }
}

/** Step 3/4: verified, the download starts by itself, and a visible button covers browsers that block it. */
export default function VerifiedPanel({ headingRef }: { headingRef?: React.Ref<HTMLHeadingElement> }) {
  const started = useRef(false);
  const [downloading, setDownloading] = useState(true);

  useEffect(() => {
    if (started.current) return; // Strict Mode runs effects twice in development; download once.
    started.current = true;
    startResumeDownload();
    const t = setTimeout(() => setDownloading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="rs-panel rs-panel--done">
      <div className="rs-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </div>
      <h2 className="rs-title" tabIndex={-1} ref={headingRef}>Email Verified Successfully</h2>
      <p className="rs-text" role="status">
        {downloading ? 'Your résumé download is starting…' : 'If the download did not start, use the button below.'}
      </p>
      <a className="rs-btn rs-btn--primary" href={RESUME_DOWNLOAD_PATH} download>
        Download Resume
      </a>
      <p className="rs-note">This download link works for 15 minutes in this browser.</p>
    </div>
  );
}
