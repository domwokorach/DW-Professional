import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/chat/permissions";
import { findOrCreateConversation } from "@/lib/chat/create-conversation";
import { getConversations } from "@/lib/chat/get-conversations";
import { createConversationSchema, safeParse } from "@/lib/chat/validation";
import type { ConversationStatus } from "@/types/conversation";

export const runtime = "nodejs";

/** Admin: list conversations for the dashboard. */
export async function GET(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ConversationStatus | null;
  const search = searchParams.get("search") ?? undefined;

  const conversations = await getConversations({ status: status ?? undefined, search });
  return NextResponse.json({ conversations });
}

/** Visitor: create or resume their conversation. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const input = safeParse(createConversationSchema, body);
  if (!input) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const conversation = await findOrCreateConversation(input.visitorId, {
    name: input.name,
    email: input.email,
  });
  return NextResponse.json({ conversation });
}
