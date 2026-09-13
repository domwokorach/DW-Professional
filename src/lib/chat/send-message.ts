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
            ? { unreadByAdmin: { increment: 1 } }
            : sender === "admin"
              ? { unreadByVisitor: { increment: 1 } }
              : {}),
        },
      }),
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
