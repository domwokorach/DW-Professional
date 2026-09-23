import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/chat/permissions";
import { findOrCreateConversation } from "@/lib/chat/create-conversation";
import { createLiveChatToken } from "@/lib/liveChatAuth";
import { safeParse, visitorIdSchema } from "@/lib/chat/validation";

export const runtime = "nodejs";

/** Issues a short-lived socket auth token: visitors get one bound to their conversation, admins to their authenticated session. */
export async function POST(request: NextRequest) {
  const secret = process.env.SOCKET_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Live chat is not configured" }, { status: 503 });
  }

  const admin = await isAdmin();
  if (admin) {
    const token = createLiveChatToken({ role: "admin", adminId: admin.userId }, secret);
    return NextResponse.json({ token });
  }

  const body = (await request.json().catch(() => ({}))) as { role?: string; visitorId?: string };

  // The admin socket explicitly requests an admin token so a lost session
  // or a disabled/suspended account surfaces as an unambiguous 401
  // instead of falling into the visitor path's "Invalid visitorId" 400 —
  // the client relies on this to distinguish "session expired" from a
  // transient network failure (see hooks/use-socket.ts).
  if (body?.role === "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const visitorId = safeParse(visitorIdSchema, body?.visitorId);
  if (!visitorId) {
    return NextResponse.json({ error: "Invalid visitorId" }, { status: 400 });
  }

  const conversation = await findOrCreateConversation(visitorId);
  const token = createLiveChatToken(
    { role: "visitor", visitorId, conversationId: conversation.id },
    secret
  );
  return NextResponse.json({ token });
}
