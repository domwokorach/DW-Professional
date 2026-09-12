import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { updatePresence } from "@/lib/chat/update-presence";

export const runtime = "nodejs";

/** Admin availability toggle, independent of socket connect/disconnect (e.g. "away" while still connected). */
export async function GET() {
  const check = await requireAdminApi();
  if (!check.ok) return check.response;

  const onlineAdminIds = await updatePresence.getOnlineAdminIds();
  return NextResponse.json({ online: onlineAdminIds.includes(check.admin.userId) });
}

export async function POST(request: Request) {
  const check = await requireAdminApi();
  if (!check.ok) return check.response;
  const admin = check.admin;

  const { available } = (await request.json().catch(() => ({}))) as { available?: boolean };
  if (available) {
    await updatePresence.markOnline(admin.userId);
  } else {
    await updatePresence.markOffline(admin.userId);
  }

  return NextResponse.json({ ok: true });
}
