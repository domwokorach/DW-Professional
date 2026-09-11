import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createLiveChatToken } from "@/lib/liveChatAuth";
import { isRateLimited } from "@/lib/portfolioChatRateLimit";
import { findOrCreateConversation } from "@/lib/chat/create-conversation";
import { sendMessage } from "@/lib/chat/send-message";
import { getMessages } from "@/lib/chat/get-messages";
import { sanitizeMessage } from "@/lib/utils/sanitize-message";

export const runtime = "nodejs";

const VISITOR_ID_PATTERN = /^[a-zA-Z0-9-]{1,64}$/;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class LiveChatValidationError extends Error {}

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function sanitiseName(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value || value.length > MAX_NAME_LENGTH) {
    throw new LiveChatValidationError("Name is required.");
  }
  return value;
}

function sanitiseEmail(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value || value.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(value)) {
    throw new LiveChatValidationError("A valid email is required.");
  }
  return value;
}

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

  const requestedVisitorId = typeof body.visitorId === "string" ? body.visitorId : "";
  const visitorId = VISITOR_ID_PATTERN.test(requestedVisitorId) ? requestedVisitorId : randomUUID();

  if (isRateLimited(`start:${clientIp(request)}`)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  try {
    const name = sanitiseName(body.name);
    const email = sanitiseEmail(body.email);
    const message = sanitizeMessage(typeof body.message === "string" ? body.message : "");
    if (!message) throw new LiveChatValidationError("Message is required.");

    const conversation = await findOrCreateConversation(visitorId, { name, email });
    await sendMessage({ conversationId: conversation.id, sender: "visitor", content: message });
    const messages = await getMessages(conversation.id);

    const token = createLiveChatToken(
      { role: "visitor", visitorId, conversationId: conversation.id },
      secret
    );

    return NextResponse.json({
      token,
      visitorId,
      conversationId: conversation.id,
      messages,
    });
  } catch (error) {
    if (error instanceof LiveChatValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to start live chat conversation", error);
    return NextResponse.json({ error: "Unable to start conversation" }, { status: 500 });
  }
}
