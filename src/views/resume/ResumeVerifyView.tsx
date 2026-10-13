'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HOME } from '@/config';
import { VerifiedPanel } from '@/components/resume';

type State = 'checking' | 'verified' | 'expired' | 'invalid' | 'error';

/** Landing page for the emailed link. The token is read from the URL fragment and sent by POST, so email scanners that only
 *  fetch the URL cannot use up the single-use link. */
export default function ResumeVerifyView() {
  const [state, setState] = useState<State>('checking');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get('t');
    // Remove the token from the address bar and history straight away.
    history.replaceState(null, '', window.location.pathname);
    if (!token) { setState('invalid'); return; }
    fetch('/api/resume/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (res) => {
        if (res.ok) return setState('verified');
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        setState(error === 'expired' ? 'expired' : res.status >= 500 || res.status === 429 ? 'error' : 'invalid');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <main className="rs-page" id="main">
      <div className="rs-card rs-card--page">
        {state === 'checking' && (
          <div className="rs-panel" role="status">
            <span className="rs-spinner rs-spinner--lg" aria-hidden="true" />
            <h1 className="rs-title">Verifying your email…</h1>
          </div>
        )}
        {state === 'verified' && <VerifiedPanel />}
        {(state === 'expired' || state === 'invalid' || state === 'error') && (
          <div className="rs-panel" role="alert">
            <h1 className="rs-title">
              {state === 'expired' ? 'This link has expired' : state === 'error' ? 'Something went wrong' : 'This link can’t be used'}
            </h1>
            <p className="rs-text">
              {state === 'error'
                ? 'We could not verify your email just now. Please try the link again in a moment.'
                : 'Links work once and last 10 minutes. Request a new one from the Resume button and we will email you a fresh code.'}
            </p>
            <Link className="rs-btn rs-btn--primary" href={HOME}>Back to the portfolio</Link>
          </div>
        )}
      </div>
    </main>
  );
}
