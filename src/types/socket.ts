import type { ChatMessage } from "./message";
import type { Conversation } from "./conversation";

export interface JoinPayload {
  conversationId: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  clientMessageId?: string;
}

export interface ReplyPayload {
  conversationId: string;
  content: string;
  clientMessageId?: string;
}

export interface TypingPayload {
  conversationId: string;
}

export interface ReadPayload {
  conversationId: string;
  reader: "visitor" | "admin";
}

export interface PresencePayload {
  userId: string;
  online: boolean;
}

export interface MessageEventPayload {
  message: ChatMessage;
  /** Echoed back to the sender so it can reconcile its optimistic message instead of duplicating it. */
  clientMessageId?: string;
}

export interface ConversationEventPayload {
  conversation: Conversation;
}

export interface TypingEventPayload {
  conversationId: string;
  sender: "visitor" | "admin";
  isTyping: boolean;
}
