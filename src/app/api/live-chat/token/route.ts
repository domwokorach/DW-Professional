import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createLiveChatToken } from "@/lib/liveChatAuth";

export const runtime = "nodejs";

const VISITOR_ID_PATTERN = /^[a-zA-Z0-9-]{1,64}$/;

export async function POST(request: NextRequest) {
  const secret = process.env.SOCKET_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Live chat is not configured" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — we'll issue a fresh visitor id.
  }

  const requestedVisitorId = typeof body.visitorId === "string" ? body.visitorId : "";
  const visitorId = VISITOR_ID_PATTERN.test(requestedVisitorId)
    ? requestedVisitorId
    : randomUUID();

  const token = createLiveChatToken(visitorId, secret);
  return NextResponse.json({ token, visitorId });
}
