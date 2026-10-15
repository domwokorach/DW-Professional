import { HOME } from './site';

/**
 * Where the Developer ID QR code leads: a branded page that then hands the visitor the CV. This is the
 * canonical, localised route; the bare /portfolio-access redirects to it (next.config.ts).
 */
export const PORTFOLIO_ACCESS_PATH = `${HOME}/portfolio-access`;

/**
 * Absolute address encoded in the QR code. Phones scan it away from this site, so it can't be relative.
 * NEXT_PUBLIC_SITE_URL wins; in production without it the live domain is used so the code never points
 * at localhost. (In development it points at localhost:3000, which a phone can't reach: to test a real
 * scan on the local network, set NEXT_PUBLIC_SITE_URL to http://<your-computer's-IP>:3000.)
 */
const origin = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://www.dominicwokorach.me' : 'http://localhost:3000')
).replace(/\/+$/, '');
export const PORTFOLIO_ACCESS_URL = `${origin}${PORTFOLIO_ACCESS_PATH}`;

/** Contact address behind the scan page's "Email Dominic" button. */
export const CONTACT_EMAIL = 'dominic.wokorach-o@outlook.com';

/**
 * Where the front-of-card QR code leads: a no-login confirmation page with an "Email Dominic" button. Absolute,
 * for the same reason as PORTFOLIO_ACCESS_URL (see above, including the note about testing on a phone).
 */
export const DEVELOPER_ID_SCAN_PATH = `${HOME}/developer-id/scan`;
export const DEVELOPER_ID_SCAN_URL = `${origin}${DEVELOPER_ID_SCAN_PATH}`;
