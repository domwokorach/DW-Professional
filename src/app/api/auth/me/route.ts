import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guard";
import { db } from "@/lib/database/db";

export const runtime = "nodejs";

export async function GET() {
  const result = await requireAdminApi();
  if (!result.ok) return result.response;

  const user = await db.user.findUnique({ where: { id: result.admin.userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      availability: user.availability,
      preferences: user.preferences,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    },
  });
}
