import type { ChatMessage } from "@/types/message";
export type MessageAcknowledgement = { message: ChatMessage; error?: never } | { error: string; message?: never };
export type DeleteMessageAcknowledgement = { ok: true; error?: never } | { ok: false; error: string };
import type {
  AdminJoinedPayload,
  AdminOpenPayload,
  AdminStatusPayload,
  ConversationEventPayload,
  ConversationStatusPayload,
  DeleteMessagePayload,
  JoinPayload,
  MessageDeletedPayload,
  MessageEventPayload,
  PresencePayload,
  ReadPayload,
  ReplyPayload,
  SendMessagePayload,
  SetStatusPayload,
  TypingEventPayload,
  TypingPayload,
} from "@/types/socket";

export interface ClientToServerEvents {
  "chat:delivered": (payload: { messageId: string; conversationId: string }) => void;
  "chat:join": (payload: JoinPayload) => void;
  "chat:message": (payload: SendMessagePayload, acknowledge?: (result: MessageAcknowledgement) => void) => void;
  "chat:reply": (payload: ReplyPayload, acknowledge?: (result: MessageAcknowledgement) => void) => void;
  "chat:typing": (payload: TypingPayload) => void;
  "chat:stop-typing": (payload: TypingPayload) => void;
  "chat:read": (payload: ReadPayload) => void;
  "chat:admin-open": (payload: AdminOpenPayload) => void;
  "chat:set-status": (payload: SetStatusPayload) => void;
  "chat:delete-message": (
    payload: DeleteMessagePayload,
    acknowledge?: (result: DeleteMessageAcknowledgement) => void
  ) => void;
  "admin:activity": () => void;
}

export interface ServerToClientEvents {
  "chat:receipt": (payload: { conversationId: string; reader: "visitor" | "admin"; readAt: string }) => void;
  "chat:message": (payload: MessageEventPayload) => void;
  "chat:typing": (payload: TypingEventPayload) => void;
  "chat:presence": (payload: PresencePayload) => void;
  "chat:new-conversation": (payload: ConversationEventPayload) => void;
  "chat:conversation-updated": (payload: ConversationEventPayload) => void;
  "chat:conversation-status": (payload: ConversationStatusPayload) => void;
  "chat:message-deleted": (payload: MessageDeletedPayload) => void;
  "admin:status": (payload: AdminStatusPayload) => void;
  "admin:joined": (payload: AdminJoinedPayload) => void;
}

export interface SocketData {
  role: "visitor" | "admin";
  visitorId?: string;
  conversationId?: string;
  adminId?: string;
}
