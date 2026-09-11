import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/chat/get-messages";

export const runtime = "nodejs";

/**
 * Read-only initial-load endpoint for both sides of a conversation.
 * Sending happens over the socket (server/socket-server.ts) so writes stay
 * on one path with rate limiting and room broadcast.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  const messages = await getMessages(conversationId);
  return NextResponse.json({ messages });
}
