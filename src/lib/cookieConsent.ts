export type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
};

export const CONSENT_VERSION = "1.0";
const STORAGE_KEY = "cookie-consent";

export const OPEN_COOKIE_SETTINGS_EVENT = "cookie-settings:open";

export function getStoredConsent(): CookiePreferences | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(
  prefs: Omit<CookiePreferences, "necessary" | "timestamp" | "version">
): CookiePreferences {
  const consent: CookiePreferences = {
    necessary: true,
    analytics: prefs.analytics,
    functional: prefs.functional,
    marketing: prefs.marketing,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // storage unavailable — consent still applies for this session
  }

  applyConsent(consent);
  return consent;
}

export function applyConsent(consent: CookiePreferences) {
  if (consent.analytics) {
    // Initialise analytics
  }
  if (consent.functional) {
    // Initialise functional/preference cookies
  }
  if (consent.marketing) {
    // Initialise marketing/remarketing tags
  }
}

export const defaultPreferences: Omit<CookiePreferences, "timestamp" | "version"> = {
  necessary: true,
  analytics: false,
  functional: false,
  marketing: false,
};
