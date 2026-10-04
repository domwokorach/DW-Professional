// Cookie / privacy consent state. The site currently sets no cookies and loads no analytics or
// tracking; this module is the single gate any optional script must go through if one is added.

export const CONSENT_KEY = 'portfolio-cookie-consent';
export type Consent = 'accepted' | 'rejected';

const CHANGE_EVENT = 'portfolio-consent-change';
const OPEN_EVENT = 'portfolio-consent-open';

/** The stored decision, or null when the visitor hasn't chosen (or storage is unavailable). */
export function getConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Private mode / blocked storage: the choice still applies for this page view.
  }
  window.dispatchEvent(new CustomEvent<Consent | null>(CHANGE_EVENT, { detail: value }));
}

/** Clears the stored decision and asks the consent panel to reopen. */
export function resetCookieConsent() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent<Consent | null>(CHANGE_EVENT, { detail: null }));
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onConsentChange(callback: (consent: Consent | null) => void) {
  const handler = (e: Event) => callback((e as CustomEvent<Consent | null>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export function onConsentOpen(callback: () => void) {
  window.addEventListener(OPEN_EVENT, callback);
  return () => window.removeEventListener(OPEN_EVENT, callback);
}

/**
 * Runs `load` only once the visitor has chosen "Accept all" — immediately if they already have,
 * otherwise when they do. Use this for any optional script (e.g. analytics); never load it directly.
 * Nothing calls this today because the site has no optional scripts.
 */
export function whenConsented(load: () => void) {
  let done = false;
  const run = () => {
    if (!done) { done = true; load(); }
  };
  if (getConsent() === 'accepted') {
    run();
    return () => {};
  }
  return onConsentChange((consent) => {
    if (consent === 'accepted') run();
  });
}
