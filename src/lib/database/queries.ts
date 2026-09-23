import type { Conversation as PrismaConversation, Message as PrismaMessage, Attachment as PrismaAttachment } from "@prisma/client";
import type { ChatMessage } from "@/types/message";
import type { Conversation } from "@/types/conversation";

export function toConversation(
  row: PrismaConversation & { messages?: PrismaMessage[] }
): Conversation {
  return {
    id: row.id,
    visitorId: row.visitorId,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    companyName: row.companyName,
    status: row.status.toLowerCase() as Conversation["status"],
    assignedAdminId: row.assignedAdminId,
    unreadByAdmin: row.unreadByAdmin,
    unreadByVisitor: row.unreadByVisitor,
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
    lastMessagePreview: row.messages?.[0]
      ? row.messages[0].deletedAt
        ? "Message deleted"
        : row.messages[0].content
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    awaitingAdminReply: row.awaitingAdminReply,
    waitingSince: row.waitingSince?.toISOString() ?? null,
    lastCandidateMessageAt: row.lastCandidateMessageAt?.toISOString() ?? null,
    lastAdminMessageAt: row.lastAdminMessageAt?.toISOString() ?? null,
    closedAt: row.closedAt?.toISOString() ?? null,
    rating: row.rating,
    feedback: row.feedback,
    ratedAt: row.ratedAt?.toISOString() ?? null,
  };
}

export function toMessage(row: PrismaMessage & { attachments?: PrismaAttachment[] }): ChatMessage {
  const deleted = Boolean(row.deletedAt);
  return {
    id: row.id,
    conversationId: row.conversationId,
    clientMessageId: row.clientMessageId ?? undefined,
    sender: row.sender.toLowerCase() as ChatMessage["sender"],
    senderId: row.senderId ?? undefined,
    content: deleted ? "" : row.content,
    status: row.status.toLowerCase() as ChatMessage["status"],
    createdAt: row.createdAt.toISOString(),
    deleted,
    attachments:
      !deleted && row.attachments?.length
        ? row.attachments.map((a) => ({
            id: a.id,
            originalName: a.originalName,
            url: a.storageKey,
            mimeType: a.mimeType,
            size: a.size,
          }))
        : undefined,
  };
}
