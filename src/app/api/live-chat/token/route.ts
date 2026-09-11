import { NextRequest, NextResponse } from "next/server";
import { createLiveChatToken } from "@/lib/liveChatAuth";
import { getConversationForVisitor } from "@/lib/liveChat/conversations";

export const runtime = "nodejs";

const ID_PATTERN = /^[a-zA-Z0-9-]{1,64}$/;

/**
 * Re-mints a short-lived socket token for an existing conversation, used on
 * reconnect (the client's socket.io `auth` callback re-fetches on every
 * (re)connect attempt). Starting a new conversation goes through
 * /api/live-chat/start instead.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SOCKET_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Live chat is not configured" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const visitorId = typeof body.visitorId === "string" ? body.visitorId : "";
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";

  if (!ID_PATTERN.test(visitorId) || !ID_PATTERN.test(conversationId)) {
    return NextResponse.json({ error: "Unknown conversation" }, { status: 404 });
  }

  const conversation = await getConversationForVisitor(conversationId, visitorId);
  if (!conversation) {
    return NextResponse.json({ error: "Unknown conversation" }, { status: 404 });
  }

  const token = createLiveChatToken({ role: "visitor", visitorId, conversationId }, secret);
  return NextResponse.json({ token });
}
