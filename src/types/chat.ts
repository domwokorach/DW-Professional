export type ConnectionState = "connecting" | "online" | "reconnecting" | "offline" | "unauthorized";

export type PanelState = "closed" | "open" | "minimised";

export type { ChatAction, ChatMessage, MessageSender, MessageStatus } from "./message";
export type { Conversation, ConversationStatus, ConversationWithMessages } from "./conversation";
export type { AdminUser } from "./user";
