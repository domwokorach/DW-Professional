import type { Conversation } from "@/types/conversation";

export { getConversationRoom, ADMIN_ROOM } from "@/lib/socket/rooms";

const PREVIEW_LENGTH = 80;

export type PresenceStatus = "online" | "waiting" | "offline";

/**
 * Presence is tracked as a binary online/offline signal (see hooks/use-admin-presence),
 * so "waiting for admin" is derived rather than server-pushed: a candidate who is online
 * with unread admin messages hasn't been answered yet.
 */
export function getPresenceStatus(conversation: Conversation, online: boolean): PresenceStatus {
  if (!online) return "offline";
  return conversation.unreadByAdmin > 0 ? "waiting" : "online";
}

export function formatChatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export function formatDateSeparator(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  }).format(date);
}

/** "Waiting 30 sec" / "Waiting 2 min" / "Waiting 8 min" — matches the brief's exact wording. */
export function formatWaitingDuration(waitingSince: string | Date, now: Date = new Date()): string {
  const since = typeof waitingSince === "string" ? new Date(waitingSince) : waitingSince;
  const seconds = Math.max(0, Math.floor((now.getTime() - since.getTime()) / 1000));
  if (seconds < 60) return `Waiting ${seconds} sec`;
  return `Waiting ${Math.floor(seconds / 60)} min`;
}

export function getMessagePreview(content: string, maxLength = PREVIEW_LENGTH): string {
  const trimmed = content.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function compareConversations(a: Conversation, b: Conversation): number {
  return Number(b.unreadByAdmin > 0) - Number(a.unreadByAdmin > 0)
    || Number(b.awaitingAdminReply) - Number(a.awaitingAdminReply)
    || (a.awaitingAdminReply && b.awaitingAdminReply ? (a.waitingSince ?? a.createdAt).localeCompare(b.waitingSince ?? b.createdAt) : 0)
    || (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt);
}
