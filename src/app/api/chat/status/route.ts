import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth/auth";
import { updatePresence } from "@/lib/chat/update-presence";

export const runtime = "nodejs";

/** Admin availability toggle, independent of socket connect/disconnect (e.g. "away" while still connected). */
export async function GET() {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const onlineAdminIds = await updatePresence.getOnlineAdminIds();
  return NextResponse.json({ online: onlineAdminIds.includes(admin.id) });
}

export async function POST(request: Request) {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { available } = (await request.json().catch(() => ({}))) as { available?: boolean };
  if (available) {
    await updatePresence.markOnline(admin.id);
  } else {
    await updatePresence.markOffline(admin.id);
  }

  return NextResponse.json({ ok: true });
}
