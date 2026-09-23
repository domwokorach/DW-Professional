import type { ChatMessage } from "@/types/message";

/** Reconcile acknowledgements, history and live events using the persisted client id. */
export function mergeMessages(previous: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const messages = new Map(previous.map((message) => [message.id, message]));
  for (const message of incoming) {
    if (message.clientMessageId && message.clientMessageId !== message.id) messages.delete(message.clientMessageId);
    const existing = messages.get(message.id);
    // History may have started loading before a newer receipt or deletion arrived.
    const rank = { sent: 0, delivered: 1, read: 2 };
    messages.set(message.id, {
      ...message,
      status: existing && rank[existing.status] > rank[message.status] ? existing.status : message.status,
      ...(existing?.deleted ? { deleted: true, content: "", attachments: undefined } : {}),
    });
  }
  return [...messages.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
