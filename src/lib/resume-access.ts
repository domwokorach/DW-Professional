// Résumé verification rules shared by the dialog, the API routes and the admin list.
// The server re-runs every check and is the final authority; client validation is only for fast feedback.

export const RESUME_LIMITS = { fullName: 100, email: 254, company: 120 } as const;
/** The PIN and link stop working this long after the email that carried them was sent. */
export const CODE_TTL_MS = 10 * 60 * 1000;
/** Wrong PIN guesses allowed per code; after that the code is burned and a new email is needed. */
export const MAX_PIN_ATTEMPTS = 5;
/** Emails per request record (the first send plus resends) within one code lifetime. */
export const MAX_SENDS = 4;
export const RESEND_COOLDOWN_MS = 60 * 1000;
/** The download grant set after verification: long enough to start the download, short enough not to be shared. */
export const GRANT_TTL_MS = 15 * 60 * 1000;
/** Recruitment records (and the IP/device metadata on them) are deleted this long after the last activity. */
export const RETENTION_DAYS = 365;

export type ResumeFields = { fullName: string; email: string; company: string };
export type ResumeField = keyof ResumeFields;
export type ResumeErrors = Partial<Record<ResumeField, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTROL = /[\u0000-\u001f\u007f]/;

export function validateResumeField(field: ResumeField, raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return { fullName: 'Enter your full name.', email: 'Enter your email address.', company: 'Enter your company or organisation.' }[field];
  if (CONTROL.test(value)) return 'Remove any special characters.';
  if (value.length > RESUME_LIMITS[field]) return `Use ${RESUME_LIMITS[field]} characters or fewer.`;
  if (field === 'fullName' && value.length < 2) return 'Enter your full name.';
  if (field === 'email' && !EMAIL.test(value)) return 'Enter a valid email address, like name@company.com.';
  return undefined;
}

export function validateResume(raw: ResumeFields): ResumeErrors {
  const errors: ResumeErrors = {};
  (['fullName', 'email', 'company'] as const).forEach((f) => {
    const message = validateResumeField(f, raw[f]);
    if (message) errors[f] = message;
  });
  return errors;
}

/** Trimmed, whitespace-collapsed values (the email is also lower-cased for its key). */
export function cleanResume(raw: ResumeFields) {
  const one = (s: string) => s.trim().replace(/\s+/g, ' ');
  const email = raw.email.trim();
  return { fullName: one(raw.fullName), email, emailKey: email.toLowerCase(), company: one(raw.company) };
}

export const PIN_PATTERN = /^\d{6}$/;
export const isPin = (value: unknown): value is string => typeof value === 'string' && PIN_PATTERN.test(value);

export type ResumeStatusValue = 'PENDING_VERIFICATION' | 'EMAIL_SENT' | 'DELIVERY_FAILED' | 'VERIFIED' | 'DOWNLOADED';
export type DisplayStatus = 'Pending Verification' | 'Email Sent' | 'Verified' | 'Downloaded' | 'Expired' | 'Delivery Failed';
export const DISPLAY_STATUSES: DisplayStatus[] = ['Pending Verification', 'Email Sent', 'Verified', 'Downloaded', 'Expired', 'Delivery Failed'];

/** What the admin sees. "Expired" = an email went out (or was queued) but the code ran out before verification. */
export function displayStatus(status: ResumeStatusValue, expiresAt: Date | string | null, now = Date.now()): DisplayStatus {
  if (status === 'DOWNLOADED') return 'Downloaded';
  if (status === 'VERIFIED') return 'Verified';
  if (status === 'DELIVERY_FAILED') return 'Delivery Failed';
  if (expiresAt && new Date(expiresAt).getTime() <= now) return 'Expired';
  return status === 'EMAIL_SENT' ? 'Email Sent' : 'Pending Verification';
}
