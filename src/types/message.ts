export type MessageSender = "visitor" | "admin" | "bot";

export type MessageStatus = "sent" | "delivered" | "read";

export type ChatAction = {
  label: string;
  href: string;
  external?: boolean;
};

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  senderId?: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
  actions?: ChatAction[];
}
