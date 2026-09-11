import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { findOrCreateConversation } from "@/lib/chat/create-conversation";
import { getConversations } from "@/lib/chat/get-conversations";
import type { ConversationStatus } from "@/types/conversation";

export const runtime = "nodejs";

const VISITOR_ID_PATTERN = /^[a-zA-Z0-9-]{1,64}$/;

/** Admin: list conversations for the dashboard. */
export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ConversationStatus | null;
  const search = searchParams.get("search") ?? undefined;

  const conversations = await getConversations({ status: status ?? undefined, search });
  return NextResponse.json({ conversations });
}

/** Visitor: create or resume their conversation. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  const visitorId = typeof body.visitorId === "string" ? body.visitorId : "";
  if (!VISITOR_ID_PATTERN.test(visitorId)) {
    return NextResponse.json({ error: "Invalid visitorId" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : undefined;
  const email = typeof body.email === "string" ? body.email : undefined;

  const conversation = await findOrCreateConversation(visitorId, { name, email });
  return NextResponse.json({ conversation });
}
