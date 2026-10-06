// Server-only: the moderation notification sent when a visitor submits a comment. Same email rules and brand
// helpers as the enquiry email (enquiry-email.server.ts): table layout, inline styles, every visitor value
// escaped, no remote images. The avatar isn't embedded (it's private until approved); the dashboard shows it.
// The only link is to /admin/comments, which requires signing in: no credentials or tokens ever go in the email.
import {
  button, CARD, CREAM, detail, esc, FONT, host, INK, INK_SOFT, LINE, linkStyle, mailto, MUTED, ON_INK_MUTED,
  PANEL, paragraphs, sectionLabel, when, WRAP,
} from '@/lib/enquiry-email.server';

export type CommentEmailInput = {
  fullName: string;
  email: string;
  company: string;
  comment: string;
  hasAvatar: boolean;
  device: string | null;
  ipAddress: string;
  submittedAt: Date;
  /** The portfolio's public URL; the admin link is built from it. */
  siteUrl: string;
};

export function renderCommentEmail(c: CommentEmailInput) {
  const site = host(c.siteUrl);
  const when_ = when(c.submittedAt);
  const adminUrl = new URL('/admin/comments', c.siteUrl).toString();
  const replyHref = mailto(c.email, 'Your comment on my portfolio');

  const rows = [
    detail('Avatar', c.hasAvatar ? 'Uploaded (view it in the dashboard)' : 'None'),
    detail('Full name', esc(c.fullName)),
    detail('Email', `<a href="${esc(replyHref)}" style="${linkStyle}">${esc(c.email)}</a>`),
    detail('Company', c.company ? esc(c.company) : '—'),
    detail('Device', esc(c.device ?? 'Unknown')),
    detail('IP address', esc(c.ipAddress)),
    detail('Submitted', esc(when_)),
    detail('Status', '<strong>Pending</strong>', true),
  ].join('');

  const preheader = `${c.fullName} left a comment that is waiting for your approval.`;

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
<title>New Candidate Comment from ${esc(c.fullName)}</title>
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
    .btn-table{width:100% !important;}
    .btn-a{display:block !important;}
    .panel{padding:18px !important;}
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
  <h1 class="h1" style="margin:22px 0 6px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">New Candidate Comment</h1>
  <p style="margin:0;font-family:${FONT};font-size:16px;line-height:24px;color:${ON_INK_MUTED};${WRAP}">${esc(c.fullName)} left a comment for &ldquo;What people are saying&rdquo;. It is not public until you approve it.</p>
</td></tr>
<tr><td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:${INK_SOFT};">&nbsp;</td></tr>

<tr><td class="px" style="padding:28px 32px 8px;">
  ${sectionLabel('Candidate')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};">
  ${rows}
  </table>
</td></tr>

<tr><td class="px" style="padding:20px 32px 8px;">
  ${sectionLabel('Comment')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td class="panel" bgcolor="${PANEL}" style="background-color:${PANEL};border:1px solid ${LINE};border-left:4px solid ${INK};border-radius:8px;padding:20px 22px;font-family:${FONT};font-size:16px;line-height:26px;color:${INK};${WRAP}">${paragraphs(c.comment)}</td>
  </tr></table>
</td></tr>

<tr><td class="px" style="padding:28px 32px 32px;">
  ${button(adminUrl, 'Open Admin Moderation', { width: 260, bg: INK, color: '#ffffff', border: INK })}
  <p style="margin:14px 0 0;font-family:${FONT};font-size:14px;line-height:22px;color:${MUTED};${WRAP}">You will be asked to sign in first. Approve, reject or delete the comment from the dashboard.</p>
</td></tr>

<tr><td class="px" bgcolor="${PANEL}" style="background-color:${PANEL};border-top:1px solid ${LINE};padding:20px 32px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">
  Submitted through <a href="${esc(c.siteUrl)}" style="${linkStyle}">${esc(site)}</a>. The candidate gave permission for these details to be used to moderate their comment.
</td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;

  const text = [
    'NEW CANDIDATE COMMENT',
    '',
    `Avatar:      ${c.hasAvatar ? 'Uploaded (view it in the dashboard)' : 'None'}`,
    `Full name:   ${c.fullName}`,
    `Email:       ${c.email}`,
    `Company:     ${c.company || '—'}`,
    `Device:      ${c.device ?? 'Unknown'}`,
    `IP address:  ${c.ipAddress}`,
    `Submitted:   ${when_}`,
    'Status:      Pending',
    '',
    'COMMENT',
    c.comment.trim(),
    '',
    `Open Admin Moderation (sign-in required): ${adminUrl}`,
    '',
    `Submitted through ${site}`,
  ].join('\n');

  return { html, text };
}
