import { db } from "@/lib/database/db";
import { sendNewConversationEmail, sendChatWaitingReminderEmail } from "@/lib/notifications/email";

const REMINDER_AFTER_MS = 5 * 60 * 1000;

/**
 * Runs on a periodic sweep (see src/lib/socket/server.ts) rather than
 * per-message: a DB-driven sweep survives a socket-server restart without
 * losing a scheduled reminder (an in-memory setTimeout per conversation
 * would not), and naturally coalesces multiple candidate messages in the
 * same waiting window into a single email via the
 * initialNotificationSentAt/reminderNotificationSentAt dedup fields.
 */
export async function sendWaitingConversationNotifications(): Promise<void> {
  const reminderCutoff = new Date(Date.now() - REMINDER_AFTER_MS);

  const due = await db.conversation.findMany({
    where: {
      awaitingAdminReply: true,
      status: { not: "CLOSED" },
      OR: [
        { initialNotificationSentAt: null },
        { reminderNotificationSentAt: null, waitingSince: { lte: reminderCutoff } },
      ],
    },
    include: { messages: { where: { sender: "VISITOR" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });

  for (const row of due) {
    const conversationInput = {
      id: row.id,
      name: row.name,
      email: row.email,
      messagePreview: row.messages[0]?.deletedAt ? undefined : row.messages[0]?.content,
      waitingSince: row.waitingSince,
    };

    try {
      if (!row.initialNotificationSentAt) {
        await sendNewConversationEmail(conversationInput);
        await db.conversation.updateMany({
          where: { id: row.id, awaitingAdminReply: true, waitingSince: row.waitingSince },
          data: { initialNotificationSentAt: new Date() },
        });
      } else if (!row.reminderNotificationSentAt && row.waitingSince && row.waitingSince <= reminderCutoff) {
        await sendChatWaitingReminderEmail(conversationInput);
        await db.conversation.updateMany({
          where: { id: row.id, awaitingAdminReply: true, waitingSince: row.waitingSince },
          data: { reminderNotificationSentAt: new Date() },
        });
      }
    } catch (error) {
      // One conversation's email failing (Resend outage, bad address) must
      // not stop the sweep from notifying about the rest.
      console.error("[chat] waiting-conversation notification failed", { conversationId: row.id, error });
    }
  }
}
