import { db } from "@/lib/database/db";
import { toMessage } from "@/lib/database/queries";
import type { ChatMessage } from "@/types/message";

export async function getMessages(conversationId: string, limit: number | undefined = 200): Promise<ChatMessage[]> {
  const rows = await db.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    include: { attachments: true },
  });

  return rows.reverse().map(toMessage);
}

export async function getMessageById(id: string): Promise<ChatMessage | null> {
  const row = await db.message.findUnique({ where: { id }, include: { attachments: true } });
  return row ? toMessage(row) : null;
}

export async function getTranscriptMessages(conversationId: string): Promise<ChatMessage[]> {
  const rows = await db.message.findMany({ where: { conversationId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], include: { attachments: true } });
  return rows.map(toMessage);
}
