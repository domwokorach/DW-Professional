export function getConversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

/** All connected admin dashboards join this room so new-conversation and presence events reach every admin. */
export const ADMIN_ROOM = "admins";
