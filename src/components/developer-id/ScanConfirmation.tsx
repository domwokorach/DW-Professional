'use client';

import { useEffect, useRef, useState } from 'react';
import { CONTACT_EMAIL } from '@/config';

/** One short pulse, only where the Web Vibration API exists (Android browsers; iOS has none, so it is simply skipped). */
function triggerScanHaptic() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(60);
}

/**
 * "Scan Successful" notice shown when the Developer ID QR code opens this page. It only says the code was opened
 * (nothing is verified server-side, so it makes no identity claim) and collects nothing. Vibration is tied to
 * tapping "Email Dominic": browsers do not allow it on page load or from a camera scan.
 */
export default function ScanConfirmation() {
  const [open, setOpen] = useState(true);
  const emailed = useRef(false);
  const action = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    action.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="scan-pop-wrap">
      <section className="scan-pop" role="dialog" aria-labelledby="scan-pop-title" aria-describedby="scan-pop-text">
        <button type="button" className="scan-pop__close" onClick={() => setOpen(false)} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <span className="scan-pop__tick" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M5.5 12.5l4.2 4.2L18.5 7.8" /></svg>
        </span>
        <h2 id="scan-pop-title">Scan Successful</h2>
        <p id="scan-pop-text">QR code opened. You can now contact Dominic Wokorach Olanya.</p>
        <a
          ref={action}
          className="scan-pop__action"
          href={`mailto:${CONTACT_EMAIL}`}
          onClick={() => {
            // The email app takes over right after; pulse once per page view, however many times it is tapped.
            if (emailed.current) return;
            emailed.current = true;
            triggerScanHaptic();
          }}
        >
          Email Dominic
        </a>
      </section>
    </div>
  );
}
