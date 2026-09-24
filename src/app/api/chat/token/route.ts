import { NextRequest, NextResponse } from "next/server";
import { isAdmin, canAccessConversation } from "@/lib/chat/permissions";
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

  const body = (await request.json().catch(() => ({}))) as { role?: string; visitorId?: string; conversationId?: string };

  // The admin socket explicitly requests an admin token so a lost session
  // or a disabled/suspended account surfaces as an unambiguous 401
  // instead of falling into the visitor path's "Invalid visitorId" 400 —
  // the client relies on this to distinguish "session expired" from a
  // transient network failure (see hooks/use-socket.ts). This check must
  // stay gated on an explicit role:"admin" request: checking isAdmin()
  // unconditionally handed out an admin-scoped token to the candidate-facing
  // widget whenever it was opened in a browser that also had an admin
  // session cookie, so every message it sent was rejected socket-side as
  // "not authorized" (the socket only accepts chat:message from role
  // "visitor").
  if (body?.role === "admin") {
    const admin = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    const token = createLiveChatToken({ role: "admin", adminId: admin.userId }, secret);
    return NextResponse.json({ token });
  }

  const visitorId = safeParse(visitorIdSchema, body?.visitorId);
  if (!visitorId) {
    return NextResponse.json({ error: "Invalid visitorId" }, { status: 400 });
  }

  const conversation = typeof body.conversationId === "string"
    ? await canAccessConversation(body.conversationId, { visitorId })
    : await findOrCreateConversation(visitorId);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const token = createLiveChatToken(
    { role: "visitor", visitorId, conversationId: conversation.id },
    secret
  );
  return NextResponse.json({ token });
}
