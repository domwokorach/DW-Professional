import { db } from "@/lib/database/db";
import { toMessage } from "@/lib/database/queries";
import type { ChatMessage } from "@/types/message";

export async function getMessages(conversationId: string, limit = 200): Promise<ChatMessage[]> {
  const rows = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return rows.map(toMessage);
}
