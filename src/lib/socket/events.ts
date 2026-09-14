export const SOCKET_EVENTS = {
  JOIN: "chat:join",
  MESSAGE: "chat:message",
  REPLY: "chat:reply",
  TYPING: "chat:typing",
  STOP_TYPING: "chat:stop-typing",
  READ: "chat:read",
  PRESENCE: "chat:presence",
  NEW_CONVERSATION: "chat:new-conversation",
  CONVERSATION_UPDATED: "chat:conversation-updated",
  ADMIN_STATUS: "admin:status",
  ADMIN_JOINED: "admin:joined",
  ADMIN_ACTIVITY: "admin:activity",
  ADMIN_OPEN: "chat:admin-open",
  SET_STATUS: "chat:set-status",
  CONVERSATION_STATUS: "chat:conversation-status",
  DELETE_MESSAGE: "chat:delete-message",
  MESSAGE_DELETED: "chat:message-deleted",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
