import { db } from "@/lib/database/db";
import { toMessage } from "@/lib/database/queries";
import type { ChatMessage, MessageSender } from "@/types/message";

export interface SendMessageInput {
  conversationId: string;
  sender: MessageSender;
  senderId?: string;
  content: string;
}

export async function sendMessage({
  conversationId,
  sender,
  senderId,
  content,
}: SendMessageInput): Promise<ChatMessage> {
  const [message] = await db.$transaction([
    db.message.create({
      data: {
        conversationId,
        sender: sender.toUpperCase() as never,
        senderId,
        content,
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
}
