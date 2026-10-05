// Server-only: brute-force protection for admin sign-in, stored in the database so it holds across server
// instances. Failures are counted per IP address and per account (email hash) in a rolling window; past a small
// allowance each further failure doubles the wait (30 s, 1 min, 2 min … capped at 15 min). Nothing is locked
// permanently: once the window passes, the counters reset.
import { createHash } from 'node:crypto';
import { getPrisma } from '@/lib/prisma.server';

const WINDOW_MS = 15 * 60 * 1000;
const FREE_FAILURES_PER_EMAIL = 5;
const FREE_FAILURES_PER_IP = 10;
const BASE_DELAY_MS = 30 * 1000;
const MAX_DELAY_MS = 15 * 60 * 1000;

export const emailHash = (email: string) => createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

const delayFor = (failures: number, free: number) =>
  failures < free ? 0 : Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (failures - free));

/** Seconds to wait before another attempt is allowed for this IP / email, or 0. */
export async function loginRetryAfter(ipAddress: string, email: string): Promise<number> {
  const prisma = getPrisma();
  if (!prisma) return 0;
  const since = new Date(Date.now() - WINDOW_MS);
  const hash = emailHash(email);
  const [byIp, byEmail] = await Promise.all([
    prisma.adminLoginAttempt.findMany({ where: { ipAddress, success: false, createdAt: { gte: since } }, select: { createdAt: true }, orderBy: { createdAt: 'desc' } }),
    prisma.adminLoginAttempt.findMany({ where: { emailHash: hash, success: false, createdAt: { gte: since } }, select: { createdAt: true }, orderBy: { createdAt: 'desc' } }),
  ]);
  const now = Date.now();
  const waitUntil = Math.max(
    byIp.length ? byIp[0].createdAt.getTime() + delayFor(byIp.length, FREE_FAILURES_PER_IP) : 0,
    byEmail.length ? byEmail[0].createdAt.getTime() + delayFor(byEmail.length, FREE_FAILURES_PER_EMAIL) : 0,
  );
  return waitUntil > now ? Math.ceil((waitUntil - now) / 1000) : 0;
}

export async function recordLoginAttempt(ipAddress: string, email: string, success: boolean) {
  const prisma = getPrisma();
  if (!prisma) return;
  try {
    await prisma.adminLoginAttempt.create({ data: { ipAddress, emailHash: emailHash(email), success } });
    // Keep the table small: attempts older than a day are no longer used for anything.
    if (Math.random() < 0.05) {
      await prisma.adminLoginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    }
  } catch (err) {
    console.error('[admin-login] Could not record attempt:', (err as Error).name);
  }
}
