import { db } from "@/lib/database/db";
import { toMessage } from "@/lib/database/queries";
import type { ChatMessage, MessageSender } from "@/types/message";

export interface SendMessageInput {
  conversationId: string;
  sender: MessageSender;
  senderId?: string;
  content: string;
  clientMessageId?: string;
}

const UNIQUE_CONSTRAINT_ERROR_CODE = "P2002";

/**
 * Persists a message and bumps the conversation's unread count/lastMessageAt.
 * Idempotent on `clientMessageId`: a second send with the same id (double
 * emit from a flaky connection, a queued-then-retried outbox entry) returns
 * the already-persisted message instead of creating a duplicate.
 */
export async function sendMessage({
  conversationId,
  sender,
  senderId,
  content,
  clientMessageId,
}: SendMessageInput): Promise<ChatMessage> {
  if (clientMessageId) {
    const existing = await db.message.findUnique({ where: { clientMessageId } });
    if (existing) return toMessage(existing);
  }

  try {
    const [message] = await db.$transaction([
      db.message.create({
        data: {
          conversationId,
          sender: sender.toUpperCase() as never,
          senderId,
          content,
          clientMessageId,
        },
      }),
      db.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          status: "OPEN",
          ...(sender === "visitor"
            ? { unreadByAdmin: { increment: 1 }, lastCandidateMessageAt: new Date(), awaitingAdminReply: true }
            : sender === "admin"
              ? {
                  unreadByVisitor: { increment: 1 },
                  lastAdminMessageAt: new Date(),
                  awaitingAdminReply: false,
                  waitingSince: null,
                  initialNotificationSentAt: null,
                  reminderNotificationSentAt: null,
                }
              : {}),
        },
      }),
      // A visitor message starts the "waiting" clock the first time only —
      // COALESCE keeps waitingSince pinned to when the admin first fell
      // behind, not reset by every subsequent nudge from the candidate. Raw
      // SQL because Prisma has no "set only if currently null" write.
      ...(sender === "visitor"
        ? [
            db.$executeRaw`UPDATE "Conversation" SET "waitingSince" = COALESCE("waitingSince", NOW()) WHERE "id" = ${conversationId}`,
          ]
        : []),
    ]);

    return toMessage(message);
  } catch (error) {
    // Concurrent double-emit of the same clientMessageId: the unique
    // constraint rejects the second insert; fetch and return the winner.
    if (
      clientMessageId &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === UNIQUE_CONSTRAINT_ERROR_CODE
    ) {
      const existing = await db.message.findUnique({ where: { clientMessageId } });
      if (existing) return toMessage(existing);
    }
    throw error;
  }
}

/**
 * Soft-deletes a message: blanks its content and stamps `deletedAt` rather
 * than removing the row, so ordering/context in the thread is preserved and
 * the deletion itself can be broadcast and replayed safely. Returns false
 * (no-op) if the message doesn't exist or doesn't belong to the given
 * conversation — callers must not trust a client-supplied conversationId
 * without this check.
 */
export async function deleteMessage(messageId: string, conversationId: string): Promise<boolean> {
  const { count } = await db.message.updateMany({
    where: { id: messageId, conversationId, deletedAt: null },
    data: { content: "", deletedAt: new Date() },
  });
  return count > 0;
}

/**
 * Persists the delivered status. Doesn't rely on the update's return value —
 * the caller already holds the full, correct message it just created and
 * only needs to flip one field on it for the emitted payload.
 */
export async function markMessageDelivered(messageId: string): Promise<void> {
  await db.message
    .update({
      where: { id: messageId },
      data: { status: "DELIVERED" },
    })
    .catch((error) => console.error("[chat] failed to mark message delivered", error));
}
