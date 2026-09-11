import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/chat/get-messages";
import { canAccessConversation, isAdmin } from "@/lib/chat/permissions";
import { conversationIdSchema, safeParse, visitorIdSchema } from "@/lib/chat/validation";

export const runtime = "nodejs";

/**
 * Read-only initial-load endpoint for both sides of a conversation.
 * Sending happens over the socket (server/socket-server.ts) so writes stay
 * on one path with rate limiting and room broadcast.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = safeParse(conversationIdSchema, searchParams.get("conversationId"));
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  const admin = await isAdmin();
  const visitorId = safeParse(visitorIdSchema, searchParams.get("visitorId") ?? undefined) ?? undefined;

  const conversation = await canAccessConversation(conversationId, { admin, visitorId });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await getMessages(conversationId);
  return NextResponse.json({ messages });
}
