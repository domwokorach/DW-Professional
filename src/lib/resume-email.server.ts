// Server-only: the verification email a candidate receives (PIN plus one-time link). Same brand helpers and email
// rules as the other emails (enquiry-email.server.ts): table layout, inline styles, escaped values, no remote images.
import { button, CARD, CREAM, esc, FONT, host, INK, INK_SOFT, LINE, MUTED, ON_INK_MUTED, PANEL, WRAP } from '@/lib/enquiry-email.server';
import { appendFile } from 'node:fs/promises';
import { getResend } from '@/lib/resend.server';

export const RESUME_VERIFY_SUBJECT = 'Your verification code for Dominic Wokorach’s résumé';

export type ResumeEmailInput = { fullName: string; pin: string; verifyUrl: string; minutes: number; siteUrl: string };

export function renderResumeEmail(a: ResumeEmailInput) {
  const site = host(a.siteUrl);
  const first = a.fullName.split(' ')[0] || a.fullName;
  const preheader = `Your code is ${a.pin}. It expires in ${a.minutes} minutes.`;
  const html = `<!DOCTYPE html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(RESUME_VERIFY_SUBJECT)}</title></head>
<body style="margin:0;padding:0;background-color:${CREAM};" bgcolor="${CREAM}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${CREAM};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CREAM}"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="max-width:560px;background-color:${CARD};border:1px solid ${LINE};border-radius:16px;border-collapse:separate;overflow:hidden;">
<tr><td bgcolor="${INK}" style="background-color:${INK};padding:28px 32px;">
  <p style="margin:0 0 14px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;">DOMINIC <span style="font-weight:400;color:${ON_INK_MUTED};">&middot; Portfolio</span></p>
  <h1 style="margin:0;font-family:${FONT};font-size:26px;line-height:32px;font-weight:700;color:#ffffff;">Verify your email</h1>
</td></tr>
<tr><td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:${INK_SOFT};">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 8px;font-family:${FONT};font-size:16px;line-height:24px;color:${INK};${WRAP}">
  <p style="margin:0 0 16px;">Hello ${esc(first)},</p>
  <p style="margin:0 0 20px;">Use this six-digit code to receive a copy of my résumé:</p>
  <p style="margin:0 0 24px;padding:16px;text-align:center;background-color:${PANEL};border:1px solid ${LINE};border-radius:12px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:34px;line-height:40px;font-weight:700;letter-spacing:10px;color:${INK};">${esc(a.pin)}</p>
  <p style="margin:0 0 20px;">Or verify with one click:</p>
  ${button(a.verifyUrl, 'Verify & download résumé', { width: 280, bg: INK, color: '#ffffff', border: INK })}
  <p style="margin:20px 0 0;font-size:14px;line-height:22px;color:${MUTED};">The code and link expire in ${a.minutes} minutes and work once. If you did not request this, ignore this email; nothing will be downloaded.</p>
</td></tr>
<tr><td style="padding:20px 32px 28px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">Sent from <a href="${esc(a.siteUrl)}" style="color:${INK};">${esc(site)}</a>. Your name, email, company and basic access details are recorded for recruitment-related follow-up.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    `Hello ${first},`, '', 'Use this six-digit code to receive a copy of my résumé:', '', `    ${a.pin}`, '',
    'Or verify with one click:', a.verifyUrl, '', `The code and link expire in ${a.minutes} minutes and work once.`,
    'If you did not request this, ignore this email; nothing will be downloaded.', '', `Sent from ${site}.`,
  ].join('\n');
  return { html, text };
}

export type OutgoingMail = { to: string; subject: string; text: string; html: string };
let testMailer: ((mail: OutgoingMail) => Promise<boolean>) | null = null;
/** Replaces Resend with a function (automated tests only), or restores it with null. */
export const useResumeMailer = (mailer: typeof testMailer) => { testMailer = mailer; };

/** Sends the email. True only when Resend accepted it; never throws and never logs the code. */
export async function sendResumeEmail(to: string, input: ResumeEmailInput, idempotencyKey: string): Promise<boolean> {
  if (testMailer) {
    const { html, text } = renderResumeEmail(input);
    return testMailer({ to, subject: RESUME_VERIFY_SUBJECT, text, html });
  }
  // Local development only: write the email to a file instead of sending it, so the flow can be tried without a mailbox.
  const sink = process.env.NODE_ENV === 'development' ? process.env.RESUME_DEV_MAIL_FILE : undefined;
  if (sink) {
    await appendFile(sink, `${JSON.stringify({ to, text: renderResumeEmail(input).text })}\n`);
    return true;
  }
  const resend = getResend();
  if (!resend) return false;
  try {
    const { html, text } = renderResumeEmail(input);
    const { error } = await resend.emails.send(
      { from: process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>', to: [to], subject: RESUME_VERIFY_SUBJECT, text, html },
      { idempotencyKey },
    );
    if (error) throw new Error(error.name);
    return true;
  } catch (err) {
    console.error('[resume] email failed:', (err as Error).name);
    return false;
  }
}
