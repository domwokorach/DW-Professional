import type {
  ConversationEventPayload,
  JoinPayload,
  MessageEventPayload,
  PresencePayload,
  ReadPayload,
  ReplyPayload,
  SendMessagePayload,
  TypingEventPayload,
  TypingPayload,
} from "@/types/socket";

export interface ClientToServerEvents {
  "chat:join": (payload: JoinPayload) => void;
  "chat:message": (payload: SendMessagePayload) => void;
  "chat:reply": (payload: ReplyPayload) => void;
  "chat:typing": (payload: TypingPayload) => void;
  "chat:stop-typing": (payload: TypingPayload) => void;
  "chat:read": (payload: ReadPayload) => void;
}

export interface ServerToClientEvents {
  "chat:message": (payload: MessageEventPayload) => void;
  "chat:typing": (payload: TypingEventPayload) => void;
  "chat:presence": (payload: PresencePayload) => void;
  "chat:new-conversation": (payload: ConversationEventPayload) => void;
  "chat:conversation-updated": (payload: ConversationEventPayload) => void;
  "chat:online": () => void;
  "chat:offline": () => void;
}

export interface SocketData {
  role: "visitor" | "admin";
  visitorId?: string;
  conversationId?: string;
  adminId?: string;
}
