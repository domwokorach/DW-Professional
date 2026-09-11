import { db } from "@/lib/database/db";
import { toConversation } from "@/lib/database/queries";
import type { Conversation } from "@/types/conversation";

/** Reuses a visitor's existing open conversation instead of forking a new thread per page load. */
export async function findOrCreateConversation(
  visitorId: string,
  details?: { name?: string; email?: string }
): Promise<Conversation> {
  const existing = await db.conversation.findFirst({
    where: { visitorId, status: { in: ["OPEN", "PENDING"] } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return toConversation(existing);

  const created = await db.conversation.create({
    data: {
      visitorId,
      name: details?.name,
      email: details?.email,
      status: "OPEN",
    },
  });

  return toConversation(created);
}
