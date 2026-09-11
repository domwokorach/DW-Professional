import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { findOrCreateConversation } from "@/lib/chat/create-conversation";
import { createLiveChatToken } from "@/lib/liveChatAuth";

export const runtime = "nodejs";

const VISITOR_ID_PATTERN = /^[a-zA-Z0-9-]{1,64}$/;

/** Issues a short-lived socket auth token: visitors get one bound to their conversation, admins to their Clerk session. */
export async function POST(request: NextRequest) {
  const secret = process.env.SOCKET_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Live chat is not configured" }, { status: 503 });
  }

  const admin = await getAdminSession();
  if (admin) {
    const token = createLiveChatToken({ role: "admin", adminId: admin.userId }, secret);
    return NextResponse.json({ token });
  }

  const body = (await request.json().catch(() => ({}))) as { visitorId?: unknown };
  const visitorId = typeof body.visitorId === "string" ? body.visitorId : "";
  if (!VISITOR_ID_PATTERN.test(visitorId)) {
    return NextResponse.json({ error: "Invalid visitorId" }, { status: 400 });
  }

  const conversation = await findOrCreateConversation(visitorId);
  const token = createLiveChatToken(
    { role: "visitor", visitorId, conversationId: conversation.id },
    secret
  );
  return NextResponse.json({ token });
}
