// Server-only: admin sessions. The browser holds a random 256-bit token in an HttpOnly cookie; the database
// stores only its SHA-256, so a database leak doesn't hand out live sessions. Every protected page and API
// validates the session here, on the server, on every request.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPrisma } from '@/lib/prisma.server';
import { clientIp, isSameOrigin, userAgent } from '@/lib/request.server';
import { CSRF_HEADER, HOME_PATH, LOGIN_PATH, SESSION_COOKIE } from './constants';

const PRODUCTION = process.env.NODE_ENV === 'production';
/** Absolute lifetime: a session ends 8 hours after sign-in however active it is. */
export const SESSION_ABSOLUTE_MS = 8 * 60 * 60 * 1000;
/** Inactivity timeout: no authenticated request for 30 minutes ends the session. */
export const SESSION_IDLE_MS = 30 * 60 * 1000;
/** lastActivityAt is written at most once a minute, not on every request. */
const TOUCH_EVERY_MS = 60 * 1000;


const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/**
 * The CSRF token for a session, derived from the (secret) session token, so nothing extra is stored and it
 * changes whenever the session does. Pages hand it to the dashboard; state-changing requests send it back in a
 * header, which a cross-site form or image can't set.
 */
const csrfFor = (sessionToken: string) => createHmac('sha256', sessionToken).update('admin-csrf-v1').digest('base64url');

const cookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure: PRODUCTION,
  sameSite: 'lax' as const,
  path: '/',
  expires,
});

export type AdminIdentity = { id: string; email: string; role: 'ADMIN' };
export type AdminSessionResult =
  | { ok: true; admin: AdminIdentity; sessionId: string; csrfToken: string }
  | { ok: false; reason: 'missing' | 'invalid' | 'expired' | 'forbidden' };

/** Only this role may moderate. Roles are read from the database, never from the request. */
const REQUIRED_ROLE = 'ADMIN';

async function readToken() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}

/**
 * Validates the current request's session: it exists, hasn't expired (absolute or idle), hasn't been revoked,
 * and belongs to an existing, active admin with the required role. Renews the idle timer only when all of that
 * holds; an old or invalid cookie never produces a new session.
 */
export async function getAdminSession(): Promise<AdminSessionResult> {
  const token = await readToken();
  if (!token) return { ok: false, reason: 'missing' };
  const prisma = getPrisma();
  if (!prisma) return { ok: false, reason: 'invalid' };

  const session = await prisma.adminSession.findUnique({
    where: { sessionTokenHash: sha256(token) },
    select: {
      id: true, expiresAt: true, lastActivityAt: true, revokedAt: true,
      // Never passwordHash.
      adminUser: { select: { id: true, email: true, role: true, isActive: true } },
    },
  });
  if (!session) return { ok: false, reason: 'invalid' };

  const now = Date.now();
  if (session.revokedAt || session.expiresAt.getTime() <= now || now - session.lastActivityAt.getTime() > SESSION_IDLE_MS) {
    return { ok: false, reason: 'expired' };
  }
  const admin = session.adminUser;
  if (!admin || !admin.isActive) return { ok: false, reason: 'invalid' };
  if (admin.role !== REQUIRED_ROLE) return { ok: false, reason: 'forbidden' };

  if (now - session.lastActivityAt.getTime() > TOUCH_EVERY_MS) {
    await prisma.adminSession.update({ where: { id: session.id }, data: { lastActivityAt: new Date(now) } }).catch(() => {});
  }
  return { ok: true, admin: { id: admin.id, email: admin.email, role: admin.role }, sessionId: session.id, csrfToken: csrfFor(token) };
}

/** Only same-site paths under /admin are accepted as a post-login destination (no open redirects). */
export function safeNext(next: unknown): string {
  if (typeof next !== 'string' || next.length > 200) return HOME_PATH;
  if (!/^\/admin(\/[A-Za-z0-9/_-]*)?(\?[A-Za-z0-9=&_-]*)?$/.test(next) || next.startsWith(LOGIN_PATH)) return HOME_PATH;
  return next === '/admin' ? HOME_PATH : next;
}

/** For admin pages (server components): returns the session or redirects to the login page. */
export async function requireAdminPage(currentPath: string) {
  const result = await getAdminSession();
  if (result.ok) return result;
  const params = new URLSearchParams({ next: safeNext(currentPath) });
  if (result.reason === 'expired') params.set('expired', '1');
  redirect(`${LOGIN_PATH}?${params}`);
}

const deny = (status: 401 | 403, error: string) =>
  Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * For admin API routes: returns the validated session, or a 401 (no valid session) / 403 (wrong role, or a
 * state-changing request without a same-origin Origin and a matching CSRF token) Response to send back.
 */
export async function requireAdminSession(request: Request, opts: { csrf?: boolean } = {}) {
  const result = await getAdminSession();
  if (!result.ok) {
    if (result.reason === 'forbidden') return deny(403, 'forbidden');
    return deny(401, result.reason === 'expired' ? 'session_expired' : 'unauthorized');
  }
  if (opts.csrf) {
    const sent = request.headers.get(CSRF_HEADER) ?? '';
    const a = Buffer.from(sent);
    const b = Buffer.from(result.csrfToken);
    if (!isSameOrigin(request) || a.length !== b.length || !timingSafeEqual(a, b)) return deny(403, 'csrf');
  }
  return result;
}

/**
 * Starts a new session after the password (and, in future, MFA) check. Any session the browser was already
 * holding is revoked first, so a session id planted before sign-in can never become authenticated (fixation).
 */
export async function createAdminSession(adminUserId: string, request: Request) {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  const previous = await readToken();
  if (previous) {
    await prisma.adminSession.updateMany({ where: { sessionTokenHash: sha256(previous), revokedAt: null }, data: { revokedAt: new Date() } });
  }
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_ABSOLUTE_MS);
  await prisma.adminSession.create({
    data: { adminUserId, sessionTokenHash: sha256(token), expiresAt, ipAddress: clientIp(request), userAgent: userAgent(request) },
  });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

/** Revokes the current session server-side (so the old cookie can't be replayed) and clears the cookie. */
export async function endAdminSession() {
  const token = await readToken();
  if (token) {
    await getPrisma()?.adminSession.updateMany({ where: { sessionTokenHash: sha256(token), revokedAt: null }, data: { revokedAt: new Date() } });
  }
  (await cookies()).set(SESSION_COOKIE, '', { ...cookieOptions(new Date(0)), maxAge: 0 });
}

/** Revokes every active session of an admin (password change, deactivation). Returns how many. */
export async function revokeAllSessions(adminUserId: string) {
  const prisma = getPrisma();
  if (!prisma) return 0;
  const { count } = await prisma.adminSession.updateMany({ where: { adminUserId, revokedAt: null }, data: { revokedAt: new Date() } });
  return count;
}
