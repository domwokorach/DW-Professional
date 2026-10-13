// Server-only: verification secrets. The PIN and link token are random, shown to the candidate once (by email)
// and stored only as keyed hashes, so a database leak reveals neither and they never appear in logs.
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/** Key for the hashes. RESUME_HASH_SECRET in production; a fixed development key elsewhere so local runs work. */
function secret(): string {
  const value = process.env.RESUME_HASH_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === 'production') throw new Error('RESUME_HASH_SECRET is not configured');
  return 'development-only-resume-secret-not-for-production';
}

const hmac = (purpose: string, value: string) => createHmac('sha256', secret()).update(`${purpose}:${value}`).digest('hex');

/** Six digits, uniformly random (leading zeros kept). */
export const newPin = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
/** 256 random bits, URL-safe. */
export const newToken = () => randomBytes(32).toString('base64url');

/** The PIN hash is bound to its record, so equal PINs on different records never share a hash. */
export const hashPin = (recordId: string, pin: string) => hmac('pin', `${recordId}:${pin}`);
export const hashToken = (token: string) => hmac('token', token);
export const hashGrant = (grant: string) => hmac('grant', grant);

/** Constant-time comparison of two hex digests. */
export function sameHash(a: string | null | undefined, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
