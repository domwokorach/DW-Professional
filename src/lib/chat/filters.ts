import type { Conversation } from "@/types/conversation";

export const CONVERSATION_FILTERS = [
  "all",
  "waiting",
  "open",
  "pending",
  "resolved",
  "unread",
  "assigned-me",
  "unassigned",
] as const;

export type ConversationFilter = (typeof CONVERSATION_FILTERS)[number];

export const FILTER_LABELS: Record<ConversationFilter, string> = {
  all: "All",
  waiting: "Waiting",
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
  unread: "Unread",
  "assigned-me": "Assigned to me",
  unassigned: "Unassigned",
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
    case "open":
      return conversation.status === "open";
    case "pending":
      return conversation.status === "pending";
    case "resolved":
      return conversation.status === "closed";
    case "unread":
      return conversation.unreadByAdmin > 0;
    case "assigned-me":
      return conversation.assignedAdminId === ctx.currentAdminId;
    case "unassigned":
      return !conversation.assignedAdminId;
    default:
      return true;
  }
}
