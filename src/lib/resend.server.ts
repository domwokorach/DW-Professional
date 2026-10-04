// Server-only: imported by the /api/contact route, never by client components, so the Resend SDK
// and RESEND_API_KEY stay out of the browser bundle.
import { Resend } from 'resend';

let client: Resend | null = null;

/** One shared Resend client per server instance; null when RESEND_API_KEY isn't configured. */
export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}
