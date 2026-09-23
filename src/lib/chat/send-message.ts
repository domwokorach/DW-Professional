import { db } from "@/lib/database/db";
import { toMessage } from "@/lib/database/queries";
import type { ChatMessage, MessageSender } from "@/types/message";

export interface SendMessageAttachmentInput {
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
}

export interface SendMessageInput {
  conversationId: string;
  sender: MessageSender;
  senderId?: string;
  content: string;
  clientMessageId?: string;
  attachments?: SendMessageAttachmentInput[];
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
  attachments,
}: SendMessageInput): Promise<ChatMessage> {
  if (clientMessageId) {
    const existing = await db.message.findUnique({ where: { clientMessageId }, include: { attachments: true } });
    if (existing) {
      if (existing.conversationId !== conversationId || existing.sender.toLowerCase() !== sender ||
          (existing.senderId ?? undefined) !== senderId) throw new Error("Message id already used");
      return toMessage(existing);
    }
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
          attachments: attachments?.length ? { create: attachments } : undefined,
        },
        include: { attachments: true },
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
      const existing = await db.message.findUnique({ where: { clientMessageId }, include: { attachments: true } });
      if (existing) {
      if (existing.conversationId !== conversationId || existing.sender.toLowerCase() !== sender ||
          (existing.senderId ?? undefined) !== senderId) throw new Error("Message id already used");
      return toMessage(existing);
    }
    }
    throw error;
  }
}

export type DeleteMessageResult = "deleted" | "already-deleted" | "not-found";

/**
 * Soft-deletes a message: blanks its content and stamps `deletedAt` rather
 * than removing the row, so ordering/context in the thread is preserved and
 * the deletion itself can be broadcast and replayed safely. Callers must not
 * trust a client-supplied conversationId without this check — the update is
 * scoped to `id + conversationId` so a message from another conversation can
 * never be reached this way.
 */
export async function deleteMessage(messageId: string, conversationId: string): Promise<DeleteMessageResult> {
  const { count } = await db.message.updateMany({
    where: { id: messageId, conversationId, deletedAt: null },
    data: { content: "", deletedAt: new Date() },
  });
  if (count > 0) return "deleted";

  // Nothing updated: either this message was already deleted (a concurrent
  // delete from another admin tab, or a duplicate click) — harmless — or it
  // never existed in this conversation at all.
  const existing = await db.message.findFirst({ where: { id: messageId, conversationId }, select: { id: true } });
  return existing ? "already-deleted" : "not-found";
}

/**
 * Persists the delivered status. Doesn't rely on the update's return value —
 * the caller already holds the full, correct message it just created and
 * only needs to flip one field on it for the emitted payload.
 */
export async function markMessageDelivered(messageId: string): Promise<void> {
  await db.message
    .updateMany({
      where: { id: messageId, status: "SENT" },
      data: { status: "DELIVERED" },
    })
    .catch((error) => console.error("[chat] failed to mark message delivered", error));
}
