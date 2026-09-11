export const SOCKET_EVENTS = {
  JOIN: "chat:join",
  MESSAGE: "chat:message",
  REPLY: "chat:reply",
  TYPING: "chat:typing",
  STOP_TYPING: "chat:stop-typing",
  READ: "chat:read",
  ONLINE: "chat:online",
  OFFLINE: "chat:offline",
  PRESENCE: "chat:presence",
  NEW_CONVERSATION: "chat:new-conversation",
  CONVERSATION_UPDATED: "chat:conversation-updated",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
