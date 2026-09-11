import { NextResponse } from "next/server";
import { updatePresence } from "@/lib/chat/update-presence";

export const runtime = "nodejs";

/** Public: lets the candidate widget show "an admin is online" without opening a socket first. */
export async function GET() {
  const online = await updatePresence.isAnyAdminOnline();
  return NextResponse.json({ online });
}
