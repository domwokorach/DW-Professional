import { sendMessage } from "@/lib/chat/send-message";
import { sanitizeMessage } from "@/lib/utils/sanitize-message";
import { candidateMessageSchema } from "@/lib/chat/validation";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { publish } from "@/lib/redis/pubsub";
import { CHAT_MESSAGE_CREATED_CHANNEL } from "@/lib/chat/message-created-channel";
import { traceChat } from "@/lib/chat/trace";
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
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const input = safeParse(candidateMessageSchema, body);
  const rawCid = typeof body?.clientMessageId === "string" ? body.clientMessageId : undefined;
  const rawConversationId = typeof body?.conversationId === "string" ? body.conversationId : undefined;
  traceChat("server:http_receipt", { cid: rawCid, conversationId: rawConversationId });

  if (!input?.clientMessageId) {
    traceChat("server:http_validation", { cid: rawCid, conversationId: rawConversationId, ok: false, error: "invalid payload" });
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }
  const admin = await isAdmin();
  const visitorId = safeParse(visitorIdSchema, body?.visitorId) ?? undefined;
  const conversation = await canAccessConversation(input.conversationId, { admin, visitorId });
  if (!conversation) {
    traceChat("server:http_validation", { cid: input.clientMessageId, conversationId: input.conversationId, ok: false, error: "not found / not authorized" });
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (conversation.status === "closed") {
    traceChat("server:http_validation", { cid: input.clientMessageId, conversationId: input.conversationId, ok: false, error: "conversation closed" });
    return NextResponse.json({ error: "This conversation has ended." }, { status: 409 });
  }
  const limit = await checkRateLimit(`chat-send:${admin?.userId ?? visitorId}`, 30, 60);
  if (!limit.allowed) {
    traceChat("server:http_validation", { cid: input.clientMessageId, conversationId: input.conversationId, ok: false, error: "rate limited" });
    return NextResponse.json({ error: "Please wait before sending another message." }, { status: 429 });
  }
  const content = sanitizeMessage(input.content);
  if (!content) {
    traceChat("server:http_validation", { cid: input.clientMessageId, conversationId: input.conversationId, ok: false, error: "empty after sanitize" });
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }
  traceChat("server:http_validation", { cid: input.clientMessageId, conversationId: input.conversationId, ok: true });
  const persistStart = Date.now();
  try {
    const message = await sendMessage({ ...input, content, sender: admin ? "admin" : "visitor", senderId: admin?.userId ?? visitorId });
    traceChat("server:http_persist", { cid: input.clientMessageId, conversationId: input.conversationId, ok: true, durationMs: Date.now() - persistStart });
    // Publication failure must not turn a committed write into an apparent failure.
    await publish(CHAT_MESSAGE_CREATED_CHANNEL, { conversationId: conversation.id, messageId: message.id })
      .then(() => traceChat("server:http_publish", { cid: input.clientMessageId, conversationId: input.conversationId, ok: true }))
      .catch((error) => {
        console.error("[chat] fallback broadcast failed", error);
        traceChat("server:http_publish", { cid: input.clientMessageId, conversationId: input.conversationId, ok: false, error: error instanceof Error ? error.message : "unknown error" });
      });
    return NextResponse.json({ message });
  } catch (error) {
    traceChat("server:http_persist", { cid: input.clientMessageId, conversationId: input.conversationId, ok: false, durationMs: Date.now() - persistStart, error: error instanceof Error ? error.message : "unknown error" });
    console.error("[chat] fallback persistence failed", error);
    return NextResponse.json({ error: "Message could not be saved. Please retry." }, { status: 500 });
  }
}
