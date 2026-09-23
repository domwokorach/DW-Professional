import type { ChatMessage } from "./message";

export type ConversationStatus = "open" | "pending" | "closed";

export interface Conversation {
  id: string;
  visitorId: string;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  companyName?: string | null;
  status: ConversationStatus;
  assignedAdminId?: string | null;
  unreadByAdmin: number;
  unreadByVisitor: number;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  createdAt: string;
  updatedAt: string;
  awaitingAdminReply: boolean;
  waitingSince?: string | null;
  lastCandidateMessageAt?: string | null;
  lastAdminMessageAt?: string | null;
  closedAt?: string | null;
  rating?: number | null;
  feedback?: string | null;
  ratedAt?: string | null;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}
