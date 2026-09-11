import { getAdminSession, type AdminSession } from "@/lib/admin";
import { getConversationById } from "@/lib/chat/get-conversations";
import type { Conversation } from "@/types/conversation";

/**
 * Central authorization surface for the chat feature. Every API route and
 * socket handler that touches a conversation should resolve through here
 * instead of re-deriving "is this an admin" / "does this belong to them"
 * checks inline — the client-sent role/id is never trusted on its own.
 */
export async function isAdmin(): Promise<AdminSession | null> {
  return getAdminSession();
}

/**
 * A conversation is visible to any authenticated admin, or to the visitor
 * who owns it (proven by knowing both the conversation id and its
 * visitorId — the id alone is a cuid and not guessable, but this still
 * keeps the check explicit rather than implicit).
 */
export async function canAccessConversation(
  conversationId: string,
  actor: { admin?: AdminSession | null; visitorId?: string }
): Promise<Conversation | null> {
  const conversation = await getConversationById(conversationId);
  if (!conversation) return null;

  if (actor.admin) return conversation;
  if (actor.visitorId && conversation.visitorId === actor.visitorId) return conversation;
  return null;
}

export function canSendAdminMessage(admin: AdminSession | null): admin is AdminSession {
  return admin !== null;
}

export function canSendCandidateMessage(
  conversation: Conversation | null,
  visitorId: string | undefined
): conversation is Conversation {
  return Boolean(conversation && visitorId && conversation.visitorId === visitorId);
}
