import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE, clearAuthCookies } from "@/lib/auth/cookies";
import { findActiveSessionByRefreshToken, revokeSession } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/securityEvents";
import { extractClientIp } from "@/lib/auth/device";
import { hasTrustedOrigin } from "@/lib/auth/guard";
import { apiError } from "@/lib/auth/apiError";

export const runtime = "nodejs";

/**
 * Invalidates the current session server-side and clears auth cookies. The
 * client is responsible for disconnecting its own Socket.IO connection on
 * receiving a successful response (see hooks/use-admin-socket.ts) — the
 * server can't reach into an open WebSocket from a stateless API route.
 */
export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return apiError("cross_site_rejected", "Cross-site request rejected.", 403);
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    const session = await findActiveSessionByRefreshToken(refreshToken);
    if (session) {
      await revokeSession(session.id);
      await logSecurityEvent({
        userId: session.userId,
        type: "SIGN_OUT",
        sessionId: session.id,
        ipAddress: extractClientIp(request.headers),
        userAgent: request.headers.get("user-agent"),
      });
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
