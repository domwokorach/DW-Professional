import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { requireAdminApi } from "@/lib/auth/guard";
import { updateSettingsSchema } from "@/lib/auth/validation";
import { validationError } from "@/lib/auth/apiError";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

const DEFAULT_PREFERENCES = {
  theme: "system",
  language: "en-GB",
  timeZone: "Europe/London",
  notifications: { newMessage: true, sound: true, browserPush: false },
};

export async function GET() {
  const result = await requireAdminApi();
  if (!result.ok) return result.response;

  const user = await db.user.findUnique({ where: { id: result.admin.userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    preferences: { ...DEFAULT_PREFERENCES, ...(user.preferences as object) },
    availability: user.availability,
  });
}

export async function PATCH(request: NextRequest) {
  const result = await requireAdminApi(request);
  if (!result.ok) return result.response;

  const body = await request.json().catch(() => null);
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const user = await db.user.findUnique({ where: { id: result.admin.userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const currentPreferences = { ...DEFAULT_PREFERENCES, ...(user.preferences as object) } as Record<string, unknown>;
  const { availability, ...preferenceUpdates } = parsed.data;
  const nextPreferences = {
    ...currentPreferences,
    ...preferenceUpdates,
    notifications: {
      ...(currentPreferences.notifications as object),
      ...(preferenceUpdates.notifications ?? {}),
    },
  };

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      preferences: nextPreferences as Prisma.InputJsonValue,
      ...(availability ? { availability } : {}),
    },
  });

  return NextResponse.json({ preferences: updated.preferences, availability: updated.availability });
}
