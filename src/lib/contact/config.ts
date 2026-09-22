/**
 * Email configuration for the "Have a project in mind?" contact form
 * (src/app/api/contact/route.ts). Server-only — never import from a
 * client component.
 */
export interface ContactEmailConfig {
  resendApiKey: string;
  fromEmail: string;
  toEmails: string[];
}

export type ContactEmailConfigResult =
  | { ok: true; config: ContactEmailConfig }
  | { ok: false; missing: string };

function resolveToEmails(): string[] {
  const raw = process.env.CONTACT_TO_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

/**
 * Reads and validates the contact form's email settings. Prefers the
 * canonical CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL names, falling back to
 * this project's pre-existing equivalents (RESEND_FROM_EMAIL,
 * ADMIN_NOTIFICATION_EMAIL / ADMIN_EMAILS) so either naming works in Vercel.
 */
export function getContactEmailConfig(): ContactEmailConfigResult {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return { ok: false, missing: "RESEND_API_KEY" };

  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) return { ok: false, missing: "CONTACT_FROM_EMAIL" };

  const toEmails = resolveToEmails();
  if (toEmails.length === 0) return { ok: false, missing: "CONTACT_TO_EMAIL" };

  return { ok: true, config: { resendApiKey, fromEmail, toEmails } };
}

/**
 * Runs the same validation at module load (i.e. on cold start of the
 * /api/contact route) so a missing variable shows up in server logs
 * immediately, rather than only being discovered on the first visitor
 * submission. Never throws — a misconfigured contact form shouldn't take
 * down the rest of the app — and never logs the value of any variable.
 */
export function logContactEmailConfigOnStartup(): void {
  const result = getContactEmailConfig();
  if (!result.ok) {
    console.error(`[contact] Missing required environment variable: ${result.missing}`);
  }
}
