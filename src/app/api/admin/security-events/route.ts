import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { requireAdminApi } from "@/lib/auth/guard";

export const runtime = "nodejs";

export async function GET() {
  const result = await requireAdminApi();
  if (!result.ok) return result.response;

  const events = await db.securityEvent.findMany({
    where: { userId: result.admin.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      ipAddress: e.ipAddress,
      createdAt: e.createdAt,
    })),
  });
}
