import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createLiveChatToken } from "@/lib/liveChatAuth";

export const runtime = "nodejs";

export async function POST() {
  const secret = process.env.SOCKET_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Live chat is not configured" }, { status: 503 });
  }

  let admin;
  try {
    admin = await requireAdmin();
  } catch (response) {
    if (response instanceof Response) return response;
    throw response;
  }

  const token = createLiveChatToken({ role: "admin", adminId: admin.userId }, secret);
  return NextResponse.json({ token });
}
