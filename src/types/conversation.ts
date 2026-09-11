import type { ChatMessage } from "./message";

export type ConversationStatus = "open" | "pending" | "closed";

export interface Conversation {
  id: string;
  visitorId: string;
  name?: string | null;
  email?: string | null;
  status: ConversationStatus;
  assignedAdminId?: string | null;
  unreadByAdmin: number;
  unreadByVisitor: number;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}
