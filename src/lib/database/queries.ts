import type { Conversation as PrismaConversation, Message as PrismaMessage } from "@prisma/client";
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
    status: row.status.toLowerCase() as Conversation["status"],
    assignedAdminId: row.assignedAdminId,
    unreadByAdmin: row.unreadByAdmin,
    unreadByVisitor: row.unreadByVisitor,
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
    lastMessagePreview: row.messages?.[0]?.content ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toMessage(row: PrismaMessage): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    sender: row.sender.toLowerCase() as ChatMessage["sender"],
    senderId: row.senderId ?? undefined,
    content: row.content,
    status: row.status.toLowerCase() as ChatMessage["status"],
    createdAt: row.createdAt.toISOString(),
  };
}
