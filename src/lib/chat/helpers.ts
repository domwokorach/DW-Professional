export { getConversationRoom, ADMIN_ROOM } from "@/lib/socket/rooms";

const PREVIEW_LENGTH = 80;

export function formatChatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export function getMessagePreview(content: string, maxLength = PREVIEW_LENGTH): string {
  const trimmed = content.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
