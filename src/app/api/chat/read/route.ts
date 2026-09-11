import { NextRequest, NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth/auth";
import { markAsRead } from "@/lib/chat/mark-as-read";

export const runtime = "nodejs";

const VISITOR_ID_PATTERN = /^[a-zA-Z0-9-]{1,64}$/;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    conversationId?: string;
    reader?: "visitor" | "admin";
    visitorId?: string;
  };

  if (!body.conversationId || (body.reader !== "visitor" && body.reader !== "admin")) {
    return NextResponse.json({ error: "conversationId and reader are required" }, { status: 400 });
  }

  if (body.reader === "admin") {
    const admin = await getSessionAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else if (!body.visitorId || !VISITOR_ID_PATTERN.test(body.visitorId)) {
    return NextResponse.json({ error: "Invalid visitorId" }, { status: 400 });
  }

  await markAsRead(body.conversationId, body.reader);
  return NextResponse.json({ ok: true });
}
