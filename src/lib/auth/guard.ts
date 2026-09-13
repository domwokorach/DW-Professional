import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/database/db";
import { ACCESS_COOKIE } from "./cookies";
import { verifyAccessToken } from "./tokens";
import type { Role, User } from "@prisma/client";

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
  status: User["status"];
  avatarUrl: string | null;
  sessionId: string;
}

function toAdminSession(user: User, sessionId: string): AdminSession {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    sessionId,
  };
}

/**
 * Resolves the current admin from the short-lived access token cookie, then
 * re-checks the user's live status/role in the database — a revoked or
 * disabled account stops working the moment its access token expires
 * (at most ~12 minutes), not just at next sign-in.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifyAccessToken(token);
  if (!claims) return null;

  const [user, session] = await Promise.all([
    db.user.findUnique({ where: { id: claims.sub } }),
    db.session.findUnique({ where: { id: claims.sessionId } }),
  ]);

  if (!user || user.status !== "ACTIVE") return null;
  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) return null;

  return toAdminSession(user, session.id);
}

export type AdminAuthResult =
  | { ok: true; admin: AdminSession }
  | { ok: false; response: NextResponse };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Cookie-based auth is vulnerable to CSRF unless every state-changing
 * request also proves it originated from this site. SameSite=Lax already
 * blocks cross-site cookie-bearing form POSTs in modern browsers, but this
 * Origin/Referer check is defense in depth for older browsers and non-form
 * requests (fetch with credentials, which SameSite=Lax does not block for
 * same-tab navigations that a hostile page could still trigger via fetch).
 */
export function hasTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return !origin; // no Origin header at all (e.g. same-origin GET) is fine
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * API-route guard that distinguishes "not signed in" (401) from "signed in
 * but the account is no longer active" (403), so admin-only routes never
 * rely on the frontend route guard or middleware alone. Also enforces the
 * same-origin check above for any non-GET/HEAD/OPTIONS request.
 */
export async function requireAdminApi(request?: NextRequest): Promise<AdminAuthResult> {
  if (request && !SAFE_METHODS.has(request.method) && !hasTrustedOrigin(request)) {
    return { ok: false, response: NextResponse.json({ error: "Cross-site request rejected" }, { status: 403 }) };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const claims = await verifyAccessToken(token);
  if (!claims) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const [user, session] = await Promise.all([
    db.user.findUnique({ where: { id: claims.sub } }),
    db.session.findUnique({ where: { id: claims.sessionId } }),
  ]);

  if (!user || user.status !== "ACTIVE") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { ok: true, admin: toAdminSession(user, session.id) };
}

export function requireRole(admin: AdminSession, roles: Role[]): boolean {
  return roles.includes(admin.role);
}
