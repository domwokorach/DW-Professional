import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE, clearAuthCookies, setAccessCookie, setRefreshCookie } from "@/lib/auth/cookies";
import { findActiveSessionByRefreshToken, rotateSession, contextFromRequest } from "@/lib/auth/session";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/lib/auth/env";
import { apiError } from "@/lib/auth/apiError";
import { hasTrustedOrigin } from "@/lib/auth/guard";

export const runtime = "nodejs";

/**
 * Refresh-token rotation: every use of a refresh token issues a brand new
 * one and invalidates the old, so a stolen-but-unused refresh token becomes
 * detectable (reuse of an already-rotated token) rather than silently
 * granting indefinite access.
 */
export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return apiError("cross_site_rejected", "Cross-site request rejected.", 403);
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return apiError("no_session", "No active session.", 401);
  }

  const session = await findActiveSessionByRefreshToken(refreshToken);
  if (!session) {
    const response = apiError("session_expired", "Your session has expired. Please sign in again.", 401);
    clearAuthCookies(response);
    return response;
  }

  const rotated = await rotateSession(session, contextFromRequest(request));
  if (!rotated) {
    const response = apiError("account_inactive", "This account is no longer active.", 403);
    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.json({ ok: true });
  setAccessCookie(response, rotated.accessToken, ACCESS_TOKEN_TTL_SECONDS);
  setRefreshCookie(response, rotated.refreshToken, rotated.refreshTtlSeconds);
  return response;
}
