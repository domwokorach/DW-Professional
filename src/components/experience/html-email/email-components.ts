/*
 * Standalone HTML email building blocks. These return plain HTML strings (table layout, inline CSS, web-safe
 * fonts, no JavaScript), which is what an email client receives. They are deliberately not React components:
 * the interactive preview in HTMLEmailPreview.tsx only displays the finished markup.
 */

export const EMAIL = {
  green: '#006A4D',
  greenDark: '#00432F',
  greenTint: '#E6F1ED',
  charcoal: '#2B2B2B',
  grey: '#55605B',
  line: '#DDE5E1',
  page: '#F2F5F3',
  white: '#FFFFFF',
  font: "Arial, Helvetica, sans-serif",
} as const;

/** Where the email images are hosted. Real emails need absolute URLs; the preview swaps this for the current origin. */
export const EMAIL_ASSET_BASE = 'https://www.dominicwokorach.me';

const escapeMap: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => escapeMap[c]);

const TABLE = 'role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"';

export function EmailHeading({ text, level = 2, align = 'left', color = EMAIL.charcoal, size = 22 }: { text: string; level?: 1 | 2 | 3; align?: 'left' | 'center'; color?: string; size?: number }) {
  return `<h${level} style="margin:0;font-family:${EMAIL.font};font-size:${size}px;line-height:${Math.round(size * 1.25)}px;font-weight:bold;color:${color};text-align:${align};">${esc(text)}</h${level}>`;
}

export function EmailParagraph({ text, color = EMAIL.grey, size = 15, align = 'left' }: { text: string; color?: string; size?: number; align?: 'left' | 'center' }) {
  return `<p style="margin:0;font-family:${EMAIL.font};font-size:${size}px;line-height:${Math.round(size * 1.6)}px;color:${color};text-align:${align};">${esc(text)}</p>`;
}

/** "Bulletproof" button: a coloured cell wrapping a padded link, so the shape survives clients that strip link backgrounds. */
export function EmailButton({ label, href = '#', variant = 'primary' }: { label: string; href?: string; variant?: 'primary' | 'secondary' }) {
  const primary = variant === 'primary';
  const bg = primary ? EMAIL.green : EMAIL.white;
  const fg = primary ? EMAIL.white : EMAIL.green;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td align="center" bgcolor="${bg}" style="border-radius:999px;background-color:${bg};border:2px solid ${EMAIL.green};"><a href="${esc(href)}" style="display:inline-block;padding:12px 30px;font-family:${EMAIL.font};font-size:15px;line-height:20px;font-weight:bold;color:${fg};text-decoration:none;border-radius:999px;">${esc(label)}</a></td></tr></table>`;
}

/** Hosted image at 2x its display size so it stays sharp on high-density screens. */
export function EmailImage({ file, alt, width, height, radius = 0 }: { file: string; alt: string; width: number; height: number; radius?: number }) {
  return `<img src="${EMAIL_ASSET_BASE}/email/${file}" width="${width}" height="${height}" alt="${esc(alt)}" style="display:block;width:${width}px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;${radius ? `border-radius:${radius}px;` : ''}">`;
}

export function EmailDivider() {
  return `<table ${TABLE}><tr><td height="1" style="height:1px;font-size:1px;line-height:1px;border-top:1px solid ${EMAIL.line};">&nbsp;</td></tr></table>`;
}

/** Thumbnail + title + text. Thumbnails are decorative (the title carries the meaning), so alt is empty. */
export function EmailFeatureRow({ thumb, title, text }: { thumb: string; title: string; text: string }) {
  return `<table ${TABLE}><tr>` +
    `<td width="64" valign="top" style="width:64px;padding:20px 16px 20px 0;">${EmailImage({ file: thumb, alt: '', width: 64, height: 64, radius: 14 })}</td>` +
    `<td valign="top" style="padding:20px 0;"><h3 style="margin:0 0 6px;font-family:${EMAIL.font};font-size:16px;line-height:22px;font-weight:bold;color:${EMAIL.charcoal};">${esc(title)}</h3>${EmailParagraph({ text, size: 14 })}</td>` +
    `</tr></table>`;
}

export function EmailHeader({ brand, label }: { brand: string; label: string }) {
  return `<table ${TABLE}><tr><td class="px" style="padding:22px 32px;border-bottom:1px solid ${EMAIL.line};background-color:${EMAIL.white};">` +
    `<p style="margin:0;font-family:${EMAIL.font};font-size:17px;line-height:22px;font-weight:bold;color:${EMAIL.green};">${esc(brand)}</p>` +
    `<p style="margin:2px 0 0;font-family:${EMAIL.font};font-size:11px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;color:${EMAIL.grey};" class="label">${esc(label)}</p>` +
    `</td></tr></table>`;
}

/** Banner image, then a centred headline, supporting line and primary call to action. */
export function EmailHero({ image, headline, text, cta }: { image: { file: string; alt: string }; headline: string; text: string; cta: string }) {
  return `<table ${TABLE}><tr><td style="font-size:0;line-height:0;background-color:${EMAIL.greenTint};">${EmailImage({ ...image, width: 600, height: 220 })}</td></tr></table>` +
    `<table ${TABLE}><tr><td class="px hero" align="center" style="padding:40px 32px 36px;background-color:${EMAIL.white};">` +
    `<h1 class="hero-h1" style="margin:0 0 12px;font-family:${EMAIL.font};font-size:32px;line-height:38px;font-weight:bold;color:${EMAIL.charcoal};text-align:center;">${esc(headline)}</h1>` +
    `<div style="max-width:460px;margin:0 auto 24px;">${EmailParagraph({ text, size: 16, align: 'center' })}</div>` +
    EmailButton({ label: cta }) +
    `</td></tr></table>`;
}

export function EmailFooter({ brand, line, disclaimer }: { brand: string; line: string; disclaimer: string }) {
  const p = (t: string, bold = false) => `<p style="margin:0 0 6px;font-family:${EMAIL.font};font-size:12px;line-height:18px;color:${EMAIL.grey};${bold ? 'font-weight:bold;' : ''}text-align:center;">${esc(t)}</p>`;
  return `<table ${TABLE}><tr><td class="px" align="center" style="padding:28px 32px;background-color:${EMAIL.white};border-top:1px solid ${EMAIL.line};">${p(brand, true)}${p(line)}${p(disclaimer)}</td></tr></table>`;
}
