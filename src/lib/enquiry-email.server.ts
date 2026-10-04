// Server-only: builds the enquiry notification email (HTML + plain text) sent through Resend.
// Pure functions with no imports at runtime, so the template can be rendered and previewed anywhere.
//
// Email HTML is not website HTML. The rules followed here:
//  - table layout, inline styles for everything that matters, explicit colours and font stacks
//  - one small <style> block, used only to enhance (stacking and full-width buttons on narrow
//    screens); without it (Outlook desktop) the desktop layout still reads correctly
//  - a fixed-width "ghost" table for Outlook, which ignores max-width, and VML buttons for it
//  - no JavaScript, remote CSS, remote images, CSS grid or hover-only behaviour
//  - every visitor-supplied value is HTML-escaped; links are built from validated parts

export type EnquiryEmailInput = {
  fields: {
    fullName: string;
    email: string;
    mobileNumber: string;
    company: string;
    projectType: string;
    message: string;
  };
  /** A file that came with the enquiry. `url` is a temporary download link (S3); without it the file is attached to this email. */
  attachment?: { filename: string; sizeLabel?: string; url?: string; expiresInDays?: number };
  /** Short reference shown in the footer. */
  reference: string;
  submittedAt: Date;
  /** The portfolio's public URL; its hostname is shown in the footer. */
  siteUrl: string;
};

// ---- Brand (from the portfolio's cream/navy palette) ---------------------------------------
const INK = '#25233f';
const INK_SOFT = '#383653';
const CREAM = '#f1eedf';
const PANEL = '#f8f5e9';
const CARD = '#fffdf7';
const LINE = '#ddd8c6';
const MUTED = '#5f5c56'; // 6.4:1 on CARD
const ON_INK_MUTED = '#d6d3e6'; // 10:1 on INK
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// ---- Helpers -------------------------------------------------------------------------------
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Long unbroken strings (URLs, addresses, file names) wrap instead of stretching the layout. */
const WRAP = 'word-break:break-word;overflow-wrap:anywhere;';

/** Paragraphs on blank lines, single line breaks kept. <br> rather than white-space:pre-wrap, which Outlook ignores. */
function paragraphs(text: string) {
  return text
    .trim()
    .split(/\r?\n[ \t]*\r?\n+/)
    .map((p, i, all) => `<p style="margin:0 0 ${i === all.length - 1 ? 0 : 14}px;">${esc(p.trim()).replace(/\r?\n/g, '<br>')}</p>`)
    .join('');
}

const FILE_KINDS: Record<string, { tag: string; label: string }> = {
  pdf: { tag: 'PDF', label: 'PDF document' },
  doc: { tag: 'DOC', label: 'Word document' },
  docx: { tag: 'DOCX', label: 'Word document' },
  png: { tag: 'PNG', label: 'PNG image' },
  jpg: { tag: 'JPG', label: 'JPEG image' },
  jpeg: { tag: 'JPG', label: 'JPEG image' },
  webp: { tag: 'WEBP', label: 'WebP image' },
};
function fileKind(filename: string) {
  const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : '';
  return FILE_KINDS[ext] ?? { tag: (ext || 'FILE').slice(0, 4).toUpperCase(), label: 'File' };
}

/** `mailto:` with the address percent-encoded around the @, so odd characters can't add header fields. */
function mailto(email: string, subject: string) {
  const at = email.lastIndexOf('@');
  const addr = `${encodeURIComponent(email.slice(0, at))}@${encodeURIComponent(email.slice(at + 1))}`;
  return `mailto:${addr}?subject=${encodeURIComponent(subject)}`;
}

/** Date and time in UK time, e.g. "Sunday 4 October 2026, 13:45 (UK time)". */
function when(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/London' }).format(d);
  return `${fmt.replace(' at ', ', ')} (UK time)`;
}

function host(siteUrl: string) {
  try {
    const h = new URL(siteUrl).hostname.replace(/^www\./, '');
    return h === 'localhost' ? 'dominicwokorach.me' : h;
  } catch {
    return 'dominicwokorach.me';
  }
}

/** Table-based "bulletproof" button: a VML round-rect for Outlook desktop, a padded link everywhere else. */
function button(href: string, label: string, opts: { width: number; bg: string; color: string; border: string }) {
  const h = esc(href);
  const l = esc(label);
  return `<table role="presentation" class="btn-table" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td align="center">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${h}" style="height:48px;v-text-anchor:middle;width:${opts.width}px;" arcsize="14%" strokecolor="${opts.border}" strokeweight="2px" fillcolor="${opts.bg}"><w:anchorlock/><center style="color:${opts.color};font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${l}</center></v:roundrect><![endif]-->
<!--[if !mso]><!-- --><a class="btn-a" href="${h}" style="display:inline-block;background-color:${opts.bg};color:${opts.color};border:2px solid ${opts.border};border-radius:8px;padding:12px 28px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;text-decoration:none;text-align:center;mso-hide:all;">${l}</a><!--<![endif]-->
</td></tr></table>`;
}

const sectionLabel = (text: string) =>
  `<p style="margin:0 0 12px;font-family:${FONT};font-size:12px;line-height:16px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">${text}</p>`;

/** One key/value row: two columns on wide screens, stacked on narrow ones (see .stack in the style block). */
function detail(label: string, valueHtml: string, last = false) {
  const border = last ? '' : `border-bottom:1px solid ${LINE};`;
  return `<tr>
<td class="stack k" width="140" valign="top" style="width:140px;padding:12px 16px 12px 0;${border}font-family:${FONT};font-size:14px;line-height:22px;font-weight:700;color:${MUTED};">${label}</td>
<td class="stack v" valign="top" style="padding:12px 0;${border}font-family:${FONT};font-size:16px;line-height:24px;color:${INK};${WRAP}">${valueHtml}</td>
</tr>`;
}

const linkStyle = `color:${INK};text-decoration:underline;`;

// ---- Template ------------------------------------------------------------------------------
export function renderEnquiryEmail({ fields: f, attachment, reference, submittedAt, siteUrl }: EnquiryEmailInput) {
  const site = host(siteUrl);
  const when_ = when(submittedAt);
  const replySubject = `Re: ${f.projectType} enquiry`;
  const replyHref = mailto(f.email, replySubject);
  const phoneDigits = f.mobileNumber.replace(/[^\d+]/g, '');

  const rows = [
    detail('Name', esc(f.fullName)),
    detail('Email', `<a href="${esc(mailto(f.email, replySubject))}" style="${linkStyle}">${esc(f.email)}</a>`),
    ...(f.mobileNumber ? [detail('Phone', `<a href="tel:${esc(phoneDigits)}" style="${linkStyle}">${esc(f.mobileNumber)}</a>`)] : []),
    ...(f.company ? [detail('Company', esc(f.company))] : []),
    detail('Enquiry type', esc(f.projectType)),
    detail('Submitted', esc(when_), true),
  ].join('');

  let attachmentBlock: string;
  if (attachment) {
    const kind = fileKind(attachment.filename);
    const meta = [kind.label, attachment.sizeLabel].filter(Boolean).join(' · ');
    const action = attachment.url
      ? `<tr><td style="padding-top:16px;">${button(attachment.url, 'Download attachment', { width: 220, bg: CARD, color: INK, border: INK })}</td></tr>
         <tr><td style="padding-top:10px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">Private download link, valid for ${attachment.expiresInDays ?? 7} days. Save the file if you need to keep it.</td></tr>`
      : `<tr><td style="padding-top:10px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">Attached to this email.</td></tr>`;
    attachmentBlock = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="48" valign="top" style="width:48px;padding-right:14px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="48" height="48" align="center" valign="middle" bgcolor="${INK}" style="width:48px;height:48px;background-color:${INK};border-radius:8px;font-family:${FONT};font-size:12px;line-height:14px;font-weight:700;color:#ffffff;">${esc(kind.tag)}</td></tr></table></td>
<td valign="middle" style="font-family:${FONT};${WRAP}"><div style="font-size:16px;line-height:22px;font-weight:700;color:${INK};">${esc(attachment.filename)}</div><div style="font-size:14px;line-height:20px;color:${MUTED};">${esc(meta)}</div></td>
</tr></table>
</td></tr>
${action}
</table>`;
  } else {
    attachmentBlock = `<p style="margin:0;font-family:${FONT};font-size:15px;line-height:24px;color:${MUTED};">No attachment included.</p>`;
  }

  const preheader = `${f.fullName} sent an enquiry about ${f.projectType}. Reply to respond.`;

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
<title>New Candidate Enquiry from ${esc(f.fullName)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0;mso-table-rspace:0;}
  a{word-break:break-word;}
  /* Tablet and below: slightly tighter padding. */
  @media only screen and (max-width:700px){
    .px{padding-left:24px !important;padding-right:24px !important;}
  }
  /* Mobile: full width, stacked details, full-width touch-size buttons. */
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
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${CREAM};">${esc(preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CREAM}" style="background-color:${CREAM};">
<tr><td align="center" class="outer" style="padding:32px 16px;">
<!--[if mso]><table role="presentation" width="640" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="width:100%;max-width:640px;background-color:${CARD};border:1px solid ${LINE};border-radius:16px;border-collapse:separate;overflow:hidden;">

<!-- Header -->
<tr><td class="px" bgcolor="${INK}" style="background-color:${INK};padding:28px 32px 24px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="36" height="36" align="center" valign="middle" bgcolor="${CREAM}" style="width:36px;height:36px;background-color:${CREAM};border-radius:18px;font-family:${FONT};font-size:12px;line-height:14px;font-weight:700;color:${INK};">DO</td>
    <td valign="middle" style="padding-left:12px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:#ffffff;">Dominic Olanya <span style="font-weight:400;color:${ON_INK_MUTED};">&middot; Portfolio</span></td>
  </tr></table>
  <h1 class="h1" style="margin:22px 0 6px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">New Candidate Enquiry</h1>
  <p style="margin:0;font-family:${FONT};font-size:16px;line-height:24px;color:${ON_INK_MUTED};${WRAP}">${esc(f.fullName)} would like to talk about <strong style="color:#ffffff;">${esc(f.projectType)}</strong>.</p>
</td></tr>
<tr><td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:${INK_SOFT};">&nbsp;</td></tr>

<!-- Candidate summary -->
<tr><td class="px" style="padding:28px 32px 8px;">
  ${sectionLabel('Candidate')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};">
  ${rows}
  </table>
</td></tr>

<!-- Message -->
<tr><td class="px" style="padding:20px 32px 8px;">
  ${sectionLabel('Message')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td class="panel" bgcolor="${PANEL}" style="background-color:${PANEL};border:1px solid ${LINE};border-left:4px solid ${INK};border-radius:8px;padding:20px 22px;font-family:${FONT};font-size:16px;line-height:26px;color:${INK};${WRAP}">${paragraphs(f.message)}</td>
  </tr></table>
</td></tr>

<!-- Attachment -->
<tr><td class="px" style="padding:24px 32px 8px;">
  ${sectionLabel('Attachment')}
  ${attachmentBlock}
</td></tr>

<!-- Reply -->
<tr><td class="px" style="padding:28px 32px 32px;">
  ${button(replyHref, 'Reply to Candidate', { width: 240, bg: INK, color: '#ffffff', border: INK })}
  <p style="margin:14px 0 0;font-family:${FONT};font-size:14px;line-height:22px;color:${MUTED};${WRAP}">Or email <a href="${esc(replyHref)}" style="${linkStyle}">${esc(f.email)}</a> directly. Replying to this email also reaches them.</p>
</td></tr>

<!-- Footer -->
<tr><td class="px" bgcolor="${PANEL}" style="background-color:${PANEL};border-top:1px solid ${LINE};padding:20px 32px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">
  Submitted through <a href="${esc(siteUrl)}" style="${linkStyle}">${esc(site)}</a><br>
  Reference ${esc(reference)}
</td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;

  const text = [
    'NEW CANDIDATE ENQUIRY',
    '',
    `Name:          ${f.fullName}`,
    `Email:         ${f.email}`,
    ...(f.mobileNumber ? [`Phone:         ${f.mobileNumber}`] : []),
    ...(f.company ? [`Company:       ${f.company}`] : []),
    `Enquiry type:  ${f.projectType}`,
    `Submitted:     ${when_}`,
    '',
    'MESSAGE',
    f.message.trim(),
    '',
    'ATTACHMENT',
    attachment
      ? [
          `${attachment.filename}${attachment.sizeLabel ? ` (${fileKind(attachment.filename).label}, ${attachment.sizeLabel})` : ''}`,
          attachment.url ? `Download (link valid for ${attachment.expiresInDays ?? 7} days): ${attachment.url}` : 'Attached to this email.',
        ].join('\n')
      : 'No attachment included.',
    '',
    `Reply to candidate: ${f.email} (replying to this email also reaches them)`,
    '',
    `Submitted through ${site}`,
    `Reference ${reference}`,
  ].join('\n');

  return { html, text };
}
