import type { Conversation } from "@/types/conversation";

export const CONVERSATION_FILTERS = ["all", "waiting", "active", "closed"] as const;

export type ConversationFilter = (typeof CONVERSATION_FILTERS)[number];

export const FILTER_LABELS: Record<ConversationFilter, string> = {
  all: "All",
  waiting: "Waiting",
  active: "Active",
  closed: "Closed",
};

export function matchesFilter(
  conversation: Conversation,
  filter: ConversationFilter,
  ctx: { onlineVisitorIds: Set<string>; currentAdminId: string }
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "waiting":
      return ctx.onlineVisitorIds.has(conversation.visitorId) && conversation.unreadByAdmin > 0;
    case "active":
      return conversation.status !== "closed";
    case "closed":
      return conversation.status === "closed";
    default:
      return true;
  }
}
