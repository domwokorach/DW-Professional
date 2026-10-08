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

/** Single source of truth for every résumé action on the site. */
export const RESUME_URL =
  'https://drive.google.com/file/d/1_LfbPH9lIH8a0WyvUZhfO4as6f1x_4cq/view?usp=drive_link';
