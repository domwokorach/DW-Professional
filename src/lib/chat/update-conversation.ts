import { db } from "@/lib/database/db";
import { toConversation } from "@/lib/database/queries";
import type { Conversation, ConversationStatus } from "@/types/conversation";

export interface UpdateConversationInput {
  status?: ConversationStatus;
  assignedAdminId?: string | null;
  unreadByAdmin?: number;
}

export async function updateConversation(
  conversationId: string,
  input: UpdateConversationInput
): Promise<Conversation> {
  const row = await db.conversation.update({
    where: { id: conversationId },
    data: {
      status: input.status ? (input.status.toUpperCase() as never) : undefined,
      assignedAdminId: input.assignedAdminId,
      unreadByAdmin: input.unreadByAdmin,
      ...(input.status === "closed"
        ? { closedAt: new Date(), awaitingAdminReply: false, waitingSince: null }
        : {}),
    },
  });

  return toConversation(row);
}

/**
 * Assigns an admin to a conversation the first time one opens/replies to it —
 * this is what drives the candidate's "waiting for an admin" → "admin joined"
 * transition. A no-op (returns null) if the conversation is already assigned,
 * so callers can tell whether this call is what newly assigned it.
 */
export async function assignConversationAdminIfUnset(
  conversationId: string,
  adminId: string
): Promise<Conversation | null> {
  const { count } = await db.conversation.updateMany({
    where: { id: conversationId, assignedAdminId: null },
    data: { assignedAdminId: adminId },
  });
  if (count === 0) return null;

  const row = await db.conversation.findUnique({ where: { id: conversationId } });
  return row ? toConversation(row) : null;
}
