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
    },
  });

  return toConversation(row);
}
