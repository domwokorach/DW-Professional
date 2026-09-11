import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/chat/permissions";
import { getConversationById } from "@/lib/chat/get-conversations";
import { getMessages } from "@/lib/chat/get-messages";
import { markAsRead } from "@/lib/chat/mark-as-read";
import { updateConversation } from "@/lib/chat/update-conversation";
import { conversationStatusSchema, safeParse } from "@/lib/chat/validation";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await getConversationById(id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await getMessages(id);
  await markAsRead(id, "admin");

  return NextResponse.json({ conversation: { ...conversation, messages } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = safeParse(conversationStatusSchema, body?.status);
  if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const conversation = await updateConversation(id, { status });
  return NextResponse.json({ conversation });
}
