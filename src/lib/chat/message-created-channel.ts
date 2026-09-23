/**
 * Redis pub/sub channel used the same way as
 * src/lib/chat/availability-channel.ts: a message created outside the
 * socket server's own process (the attachment-completion REST route, which
 * has to run in the Next.js/Vercel app because it needs to stream the
 * uploaded blob's bytes back for server-side signature verification) still
 * needs to reach every connected client live. The payload stays a bare id
 * pair rather than the full message — the subscriber re-reads the row so
 * there is exactly one place that assembles a broadcast-ready message.
 */
export const CHAT_MESSAGE_CREATED_CHANNEL = "chat:message-created";

export interface ChatMessageCreatedEvent {
  conversationId: string;
  messageId: string;
}
