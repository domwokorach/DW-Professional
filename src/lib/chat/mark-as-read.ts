import { db } from "@/lib/database/db";

/**
 * Marks the other side's unread messages as read. `reader: "admin"` clears
 * the visitor's messages (and the admin's unread counter), and vice versa.
 */
export async function markAsRead(conversationId: string, reader: "visitor" | "admin"): Promise<void> {
  const unreadSender = reader === "admin" ? "VISITOR" : "ADMIN";

  await db.$transaction([
    db.message.updateMany({
      where: { conversationId, sender: unreadSender as never, status: { not: "READ" } },
      data: { status: "READ", readAt: new Date() },
    }),
    db.conversation.update({
      where: { id: conversationId },
      data: reader === "admin" ? { unreadByAdmin: 0 } : { unreadByVisitor: 0 },
    }),
  ]);
}
