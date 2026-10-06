// Server-only: the notification sent when someone completes the Portfolio Access form and opens the CV. Same email
// rules and brand helpers as the enquiry and comment emails (enquiry-email.server.ts): table layout, inline styles,
// every visitor value escaped, no remote images, stacked rows on narrow screens.
import {
  CARD, CREAM, detail, esc, FONT, host, INK, INK_SOFT, LINE, linkStyle, mailto, MUTED, ON_INK_MUTED, PANEL,
  sectionLabel, when, WRAP,
} from '@/lib/enquiry-email.server';
import { formatBytes } from '@/lib/contact';

export type AccessEmailInput = {
  fullName: string;
  email: string;
  mobile: string;
  company: string;
  companyNumber: string | null;
  linkedin: string;
  companyWebsite: string;
  portfolio: string;
  device: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  source: string;
  page: string;
  accessedAt: Date;
  /** How many times this candidate has submitted (1 for a new session). */
  submissionCount?: number;
  /** The optional Upload / Camera file (attached to the email itself). */
  attachment?: { filename: string; size: number; source: 'upload' | 'camera' };
  /** The portfolio's public URL, for the footer link. */
  siteUrl: string;
};

/** A dialable tel: href: only a leading + and digits survive, so nothing else can be injected into the link. */
const telHref = (mobile: string) => `tel:${mobile.trim().startsWith('+') ? '+' : ''}${mobile.replace(/\D/g, '')}`;

export const accessEmailSubject = (fullName: string) =>
  `New Portfolio CV Access — ${fullName}`.replace(/[\r\n]+/g, ' ').slice(0, 150);

export function renderAccessEmail(a: AccessEmailInput) {
  const site = host(a.siteUrl);
  const when_ = when(a.accessedAt);
  const replyHref = mailto(a.email, 'Following up on my CV');
  const company = a.company ? `${a.company}${a.companyNumber ? ` (Company no. ${a.companyNumber})` : ''}` : '—';
  const ip = a.ipAddress ?? 'Not available';
  // Validated absolute http(s) URLs (server-side), so they are safe as hrefs once escaped.
  const fileLabel = a.attachment
    ? `${a.attachment.filename} (${formatBytes(a.attachment.size)}, ${a.attachment.source === 'camera' ? 'camera photo' : 'uploaded'}) — attached to this email`
    : null;
  const links = ([['LinkedIn', a.linkedin], ['Company website', a.companyWebsite], ['Portfolio', a.portfolio]] as const).filter(([, href]) => href);
  const device = a.device ?? 'Unknown';

  const candidate = [
    detail('Name', esc(a.fullName)),
    detail('Email', `<a href="${esc(replyHref)}" style="${linkStyle}">${esc(a.email)}</a>`),
    detail('Mobile', `<a href="${esc(telHref(a.mobile))}" style="${linkStyle}">${esc(a.mobile)}</a>`),
    detail('Company', esc(company), !links.length && !fileLabel),
    ...links.map(([label, href], i) => detail(label, `<a href="${esc(href)}" style="${linkStyle}">${esc(href)}</a>`, i === links.length - 1 && !fileLabel)),
    ...(fileLabel ? [detail('Attachment', esc(fileLabel), true)] : []),
  ].join('');

  const access = [
    detail('Date/Time', esc(when_)),
    ...(a.submissionCount && a.submissionCount > 1 ? [detail('Session', `Returning candidate · submission ${a.submissionCount}`)] : []),
    detail('Device', esc(device)),
    ...(a.userAgent ? [detail('Browser', `<span style="font-size:13px;line-height:20px;color:${MUTED};">${esc(a.userAgent)}</span>`)] : []),
    detail('IP address', esc(ip)),
    detail('Source', esc(a.source)),
    detail('Page', `<a href="${esc(a.page)}" style="${linkStyle}">${esc(a.page)}</a>`, true),
  ].join('');

  const preheader = `${a.fullName}${a.company ? ` (${a.company})` : ''} has accessed your portfolio CV.`;

  const html = `<!DOCTYPE html>
<html lang="en-GB" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(accessEmailSubject(a.fullName))}</title>
<style>
  body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0;mso-table-rspace:0;}
  a{word-break:break-word;}
  @media only screen and (max-width:700px){.px{padding-left:24px !important;padding-right:24px !important;}}
  @media only screen and (max-width:520px){
    .outer{padding:0 !important;}
    .card{border-radius:0 !important;border-left:0 !important;border-right:0 !important;}
    .px{padding-left:20px !important;padding-right:20px !important;}
    .h1{font-size:24px !important;line-height:30px !important;}
    .stack{display:block !important;width:100% !important;}
    .k{padding:14px 0 0 !important;border-bottom:0 !important;}
    .v{padding:2px 0 14px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${CREAM};" bgcolor="${CREAM}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${CREAM};">${esc(preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CREAM}" style="background-color:${CREAM};">
<tr><td align="center" class="outer" style="padding:32px 16px;">
<!--[if mso]><table role="presentation" width="640" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="width:100%;max-width:640px;background-color:${CARD};border:1px solid ${LINE};border-radius:16px;border-collapse:separate;overflow:hidden;">

<tr><td class="px" bgcolor="${INK}" style="background-color:${INK};padding:28px 32px 24px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="36" height="36" align="center" valign="middle" bgcolor="${CREAM}" style="width:36px;height:36px;background-color:${CREAM};border-radius:18px;font-family:${FONT};font-size:12px;line-height:14px;font-weight:700;color:${INK};">DO</td>
    <td valign="middle" style="padding-left:12px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:#ffffff;">DOMINIC <span style="font-weight:400;color:${ON_INK_MUTED};">&middot; Portfolio</span></td>
  </tr></table>
  <h1 class="h1" style="margin:22px 0 6px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">New Portfolio CV Access</h1>
  <p style="margin:0;font-family:${FONT};font-size:16px;line-height:24px;color:${ON_INK_MUTED};${WRAP}">A candidate has accessed the portfolio CV.</p>
</td></tr>
<tr><td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:${INK_SOFT};">&nbsp;</td></tr>

<tr><td class="px" style="padding:28px 32px 8px;">
  ${sectionLabel('Candidate details')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};">
  ${candidate}
  </table>
</td></tr>

<tr><td class="px" style="padding:20px 32px 32px;">
  ${sectionLabel('Access details')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};">
  ${access}
  </table>
</td></tr>

<tr><td class="px" bgcolor="${PANEL}" style="background-color:${PANEL};border-top:1px solid ${LINE};padding:20px 32px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">
  Submitted through <a href="${esc(a.siteUrl)}" style="${linkStyle}">${esc(site)}</a>. The candidate was told on the form that these details and basic access metadata are used to manage and monitor CV access.
</td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;

  const text = [
    'A candidate has accessed the portfolio CV.',
    '',
    'CANDIDATE DETAILS',
    `Name:        ${a.fullName}`,
    `Email:       ${a.email}`,
    `Mobile:      ${a.mobile}`,
    `Company:     ${company}`,
    ...links.map(([label, href]) => `${`${label}:`.padEnd(Math.max(13, label.length + 2))}${href}`),
    ...(fileLabel ? [`Attachment:  ${fileLabel}`] : []),
    '',
    'ACCESS DETAILS',
    `Date/Time:   ${when_}`,
    ...(a.submissionCount && a.submissionCount > 1 ? [`Session:     Returning candidate · submission ${a.submissionCount}`] : []),
    `Device:      ${device}`,
    ...(a.userAgent ? [`Browser:     ${a.userAgent}`] : []),
    `IP address:  ${ip}`,
    `Source:      ${a.source}`,
    `Page:        ${a.page}`,
    '',
    `Submitted through ${site}`,
  ].join('\n');

  return { html, text };
}
