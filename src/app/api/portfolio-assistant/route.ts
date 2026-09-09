import { NextRequest, NextResponse } from "next/server";
import { matchIntent } from "@/lib/portfolioAssistant/match";
import { getResponseForIntent } from "@/lib/portfolioAssistant/responses";
import { isRateLimited } from "@/lib/portfolioChatRateLimit";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 500;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }

  const intentId = matchIntent(message);
  const response = getResponseForIntent(intentId);

  return NextResponse.json(response);
}
