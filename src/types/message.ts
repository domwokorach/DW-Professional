export type MessageSender = "visitor" | "admin" | "bot";

export type MessageStatus = "sent" | "delivered" | "read";

export type ChatAction = {
  label: string;
  href: string;
  external?: boolean;
};

export interface MessageAttachment {
  id: string;
  originalName: string;
  /** Downloadable URL — the blob store's own URL, never a raw filesystem path. */
  url: string;
  mimeType: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  clientMessageId?: string;
  conversationId: string;
  sender: MessageSender;
  senderId?: string;
  content: string;
  status: MessageStatus;
  localStatus?: "sending" | "failed";
  createdAt: string;
  actions?: ChatAction[];
  deleted?: boolean;
  attachments?: MessageAttachment[];
}
