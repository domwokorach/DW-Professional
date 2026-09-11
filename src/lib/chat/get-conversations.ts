import { db } from "@/lib/database/db";
import { toConversation } from "@/lib/database/queries";
import type { Conversation, ConversationStatus } from "@/types/conversation";

export interface GetConversationsOptions {
  status?: ConversationStatus;
  search?: string;
  limit?: number;
}

export async function getConversations({
  status,
  search,
  limit = 50,
}: GetConversationsOptions = {}): Promise<Conversation[]> {
  const rows = await db.conversation.findMany({
    where: {
      status: status ? status.toUpperCase() as never : undefined,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { lastMessageAt: "desc" },
    take: limit,
  });

  return rows.map(toConversation);
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const row = await db.conversation.findUnique({ where: { id } });
  return row ? toConversation(row) : null;
}
