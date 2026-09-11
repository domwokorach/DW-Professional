import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createLiveChatToken } from "@/lib/liveChatAuth";
import { isRateLimited } from "@/lib/portfolioChatRateLimit";
import { LiveChatValidationError, startConversation } from "@/lib/liveChat/conversations";

export const runtime = "nodejs";

const VISITOR_ID_PATTERN = /^[a-zA-Z0-9-]{1,64}$/;

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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
    const conversation = await startConversation({
      visitorId,
      name: body.name,
      email: body.email,
      message: body.message,
    } as { visitorId: string; name: string; email: string; message: string });

    const token = createLiveChatToken(
      { role: "visitor", visitorId, conversationId: conversation.id },
      secret
    );

    return NextResponse.json({
      token,
      visitorId,
      conversationId: conversation.id,
      messages: conversation.messages,
    });
  } catch (error) {
    if (error instanceof LiveChatValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to start live chat conversation", error);
    return NextResponse.json({ error: "Unable to start conversation" }, { status: 500 });
  }
}
