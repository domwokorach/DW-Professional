import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { requireAdminApi } from "@/lib/auth/guard";
import { apiError } from "@/lib/auth/apiError";
import { revokeSession } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/securityEvents";
import { extractClientIp } from "@/lib/auth/device";
import { clearAuthCookies } from "@/lib/auth/cookies";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const result = await requireAdminApi(request);
  if (!result.ok) return result.response;

  const { sessionId } = await params;
  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== result.admin.userId) {
    return apiError("not_found", "Session not found.", 404);
  }

  await revokeSession(sessionId);
  await logSecurityEvent({
    userId: result.admin.userId,
    type: "SESSION_REVOKED",
    sessionId,
    ipAddress: extractClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  const response = NextResponse.json({ ok: true });
  // Revoking the session currently in use should sign this browser out too.
  if (sessionId === result.admin.sessionId) clearAuthCookies(response);
  return response;
}
