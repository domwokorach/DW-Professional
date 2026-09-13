import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { requireAdminApi } from "@/lib/auth/guard";

export const runtime = "nodejs";

export async function GET() {
  const result = await requireAdminApi();
  if (!result.ok) return result.response;

  const sessions = await db.session.findMany({
    where: { userId: result.admin.userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
  });

  return NextResponse.json({
    sessions: sessions.map((session) => ({
      id: session.id,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      operatingSystem: session.operatingSystem,
      browser: session.browser,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === result.admin.sessionId,
    })),
  });
}
