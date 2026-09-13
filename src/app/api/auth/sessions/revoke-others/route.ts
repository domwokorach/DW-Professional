import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guard";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/securityEvents";
import { extractClientIp } from "@/lib/auth/device";
import { db } from "@/lib/database/db";
import { getAppUrl } from "@/lib/auth/env";
import { sendSecurityAlertEmail } from "@/services/email/email.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const result = await requireAdminApi(request);
  if (!result.ok) return result.response;

  await revokeAllSessionsForUser(result.admin.userId, result.admin.sessionId);
  await logSecurityEvent({
    userId: result.admin.userId,
    type: "SESSION_REVOKED",
    sessionId: result.admin.sessionId,
    ipAddress: extractClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
    metadata: { scope: "all_other_sessions" },
  });

  const user = await db.user.findUnique({ where: { id: result.admin.userId } });
  if (user) {
    void sendSecurityAlertEmail({
      to: user.email,
      title: "All other sessions were signed out",
      message: "You (or someone with access to your account) signed out every other device from your admin account.",
      occurredAt: new Date().toLocaleString("en-GB"),
      actionUrl: `${getAppUrl()}/admin/devices`,
      actionLabel: "Review devices",
    });
  }

  return NextResponse.json({ ok: true });
}
