import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { requireAdminApi } from "@/lib/auth/guard";
import { updateProfileSchema } from "@/lib/auth/validation";
import { validationError } from "@/lib/auth/apiError";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const result = await requireAdminApi(request);
  if (!result.ok) return result.response;

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const user = await db.user.update({
    where: { id: result.admin.userId },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.avatarUrl !== undefined ? { avatarUrl: parsed.data.avatarUrl } : {}),
    },
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
  });
}
