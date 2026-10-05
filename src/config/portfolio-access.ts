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

/** The CV, defined once. The page links to this and never embeds it (browsers handle .docx differently). */
export const CV_URL =
  'https://res.cloudinary.com/dkkuwmr42/raw/upload/v1791184678/Full%20Stack%20Developer/Dominic_Wokorach_Olanya_CV_vrt6qm.docx';
export const CV_FILENAME = 'Dominic_Wokorach_Olanya_CV.docx';

/**
 * Same file with Cloudinary's attachment flag, which makes the server send Content-Disposition: attachment.
 * The HTML `download` attribute is ignored for cross-origin links (Cloudinary is another origin), so this
 * is what makes "Download CV" actually save the file, under a clean name, instead of just navigating to it.
 */
export const CV_DOWNLOAD_URL = CV_URL.replace('/raw/upload/', `/raw/upload/fl_attachment:${CV_FILENAME.replace(/\.docx$/, '')}/`);
