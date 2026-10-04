'use client';

import { useEffect, useState } from 'react';
import { getConsent, onConsentChange, resetCookieConsent, type Consent } from '@/lib/consent';

const LABEL: Record<Consent, string> = { accepted: 'Accepted all', rejected: 'Rejected all' };

/** Shows the stored choice and reopens the consent panel so the visitor can choose again. */
export default function CookiePreferences() {
  const [consent, setConsentState] = useState<Consent | null | undefined>(undefined);

  useEffect(() => {
    setConsentState(getConsent());
    return onConsentChange(setConsentState);
  }, []);

  return (
    <div className="cookie-prefs">
      <p className="cookie-prefs__status" aria-live="polite">
        Your current choice: <strong>{consent === undefined ? '…' : consent ? LABEL[consent] : 'Not chosen yet'}</strong>
      </p>
      <button type="button" className="cookie-prefs__button" onClick={resetCookieConsent}>Cookie preferences</button>
    </div>
  );
}
