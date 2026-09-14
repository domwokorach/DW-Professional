import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guard";
import { getConversationById } from "@/lib/chat/get-conversations";
import { getMessages } from "@/lib/chat/get-messages";
import { markAsRead } from "@/lib/chat/mark-as-read";
import { updateConversation } from "@/lib/chat/update-conversation";
import { conversationPatchSchema, safeParse } from "@/lib/chat/validation";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdminApi();
  if (!check.ok) return check.response;

  const { id } = await params;
  const conversation = await getConversationById(id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await getMessages(id);
  await markAsRead(id, "admin");

  return NextResponse.json({ conversation: { ...conversation, messages } });
}

// Conversation status (close/reopen) is handled over Socket.IO
// (`chat:set-status`, src/lib/socket/server.ts) so it can broadcast to every
// connected admin and the candidate live — a REST route here has no way to
// reach the standalone socket server. This route only handles the
// single-admin-local "mark as unread" action.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdminApi();
  if (!check.ok) return check.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const input = safeParse(conversationPatchSchema, body);
  if (!input || input.markUnread === undefined) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const conversation = await updateConversation(id, { unreadByAdmin: 1 });
  return NextResponse.json({ conversation });
}
