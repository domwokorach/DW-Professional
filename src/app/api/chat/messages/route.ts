import { sendMessage } from "@/lib/chat/send-message";
import { sanitizeMessage } from "@/lib/utils/sanitize-message";
import { candidateMessageSchema } from "@/lib/chat/validation";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { publish } from "@/lib/redis/pubsub";
import { CHAT_MESSAGE_CREATED_CHANNEL } from "@/lib/chat/message-created-channel";
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

/** Durable fallback when the standalone realtime host is unavailable. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const input = safeParse(candidateMessageSchema, body);
  if (!input?.clientMessageId) return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  const admin = await isAdmin();
  const visitorId = safeParse(visitorIdSchema, body?.visitorId) ?? undefined;
  const conversation = await canAccessConversation(input.conversationId, { admin, visitorId });
  if (!conversation) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (conversation.status === "closed") return NextResponse.json({ error: "This conversation has ended." }, { status: 409 });
  const limit = await checkRateLimit(`chat-send:${admin?.userId ?? visitorId}`, 30, 60);
  if (!limit.allowed) return NextResponse.json({ error: "Please wait before sending another message." }, { status: 429 });
  const content = sanitizeMessage(input.content);
  if (!content) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  try {
    const message = await sendMessage({ ...input, content, sender: admin ? "admin" : "visitor", senderId: admin?.userId ?? visitorId });
    // Publication failure must not turn a committed write into an apparent failure.
    await publish(CHAT_MESSAGE_CREATED_CHANNEL, { conversationId: conversation.id, messageId: message.id })
      .catch((error) => console.error("[chat] fallback broadcast failed", error));
    return NextResponse.json({ message });
  } catch (error) {
    console.error("[chat] fallback persistence failed", error);
    return NextResponse.json({ error: "Message could not be saved. Please retry." }, { status: 500 });
  }
}
