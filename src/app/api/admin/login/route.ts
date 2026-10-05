import { audit } from '@/lib/admin/audit.server';
import { loginRetryAfter, recordLoginAttempt } from '@/lib/admin/login-throttle.server';
import { PASSWORD_MAX, verifyPassword } from '@/lib/admin/password.server';
import { createAdminSession, safeNext } from '@/lib/admin/session.server';
import { getPrisma } from '@/lib/prisma.server';
import { clientIp, isSameOrigin } from '@/lib/request.server';

export const dynamic = 'force-dynamic';

const json = (body: unknown, status: number, headers?: Record<string, string>) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

/** One message for every credential failure, so the response never says whether an email has an account. */
const INVALID = { error: 'invalid_credentials', message: 'Invalid email or password.' };

/**
 * Admin sign-in: email + password → validated server-side → active account → new session + HttpOnly cookie.
 * The client then navigates to `redirect`. MFA, when added, slots in between the password check and
 * createAdminSession (issue a short-lived "password verified" challenge instead of a session).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const prisma = getPrisma();
  if (!prisma) return json({ error: 'unavailable', message: 'Sign-in is not available right now.' }, 503);

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('shape');
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || email.length > 254 || !password || password.length > PASSWORD_MAX) return json(INVALID, 401);

  // Anything unexpected below (typically a database that isn't set up or reachable) is a server problem, not a
  // credentials problem: answer 503 with a clear message instead of an error page, so the form never mislabels it
  // as "Invalid email or password". Nothing from the error itself is sent to the browser.
  try {
    const ip = clientIp(request);
    const retryAfter = await loginRetryAfter(ip, email);
    if (retryAfter > 0) {
      await audit('LOGIN_THROTTLED', { request });
      const minutes = Math.ceil(retryAfter / 60);
      return json(
        { error: 'rate_limited', message: `Too many sign-in attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
        429,
        { 'Retry-After': String(retryAfter) },
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, isActive: true, role: true },
    });
    // Always runs a hash verification, even for unknown emails, so timing doesn't reveal which emails exist.
    const passwordOk = await verifyPassword(admin?.passwordHash ?? null, password);
    if (!admin || !passwordOk || !admin.isActive || admin.role !== 'ADMIN') {
      await recordLoginAttempt(ip, email, false);
      await audit('LOGIN_FAILED', { adminUserId: admin?.id ?? null, request });
      return json(INVALID, 401);
    }

    await createAdminSession(admin.id, request);
    await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    await recordLoginAttempt(ip, email, true);
    await audit('LOGIN_SUCCESS', { adminUserId: admin.id, request });
    return json({ ok: true, redirect: safeNext(body.next) }, 200);
  } catch (err) {
    const code = (err as { code?: string }).code ?? (err as Error).name;
    console.error('[admin-login] database error:', code);
    // P2021 = a table doesn't exist: the migrations haven't been applied to this database.
    const hint = code === 'P2021' && process.env.NODE_ENV !== 'production'
      ? ' (Development hint: the admin tables don\u2019t exist in this database yet. Run: npm run db:deploy)'
      : '';
    return json({ error: 'unavailable', message: `Sign-in is not available right now. Please try again shortly.${hint}` }, 503);
  }
}
