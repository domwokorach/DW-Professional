import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/animate-ui/components/radix/sidebar";
import type { Conversation } from "@/types/chat";
import { formatChatDate, getMessagePreview, getPresenceStatus } from "@/lib/chat/helpers";
import { PresenceDot, presenceLabel } from "./OnlineStatus";
import CandidateAvatar from "./CandidateAvatar";
import UnreadBadge from "./UnreadBadge";

export default function ConversationItem({
  conversation,
  online,
  selected,
  onSelect,
}: {
  conversation: Conversation;
  online: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const displayName = conversation.name || conversation.visitorId;
  const preview = conversation.lastMessagePreview
    ? getMessagePreview(conversation.lastMessagePreview, 48)
    : "No messages yet";
  const status = getPresenceStatus(conversation, online);
  const contact = [conversation.email, conversation.mobile].filter(Boolean).join(" · ");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={selected}
        onClick={onSelect}
        size="lg"
        className="h-auto items-start gap-2.5 py-2.5"
        aria-label={`Open conversation with ${displayName}${contact ? `, ${contact}` : ""}${
          conversation.unreadByAdmin > 0 ? `, ${conversation.unreadByAdmin} unread messages` : ""
        }, ${presenceLabel(status)}`}
      >
        <span className="relative mt-0.5 shrink-0">
          <CandidateAvatar label={displayName} className="h-9 w-9" />
          <PresenceDot status={status} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-white">{displayName}</span>
            <span className="shrink-0 text-[11px] font-normal text-muted">
              {formatChatDate(conversation.lastMessageAt ?? conversation.createdAt)}
            </span>
          </span>
          {contact ? (
            <span className="truncate text-[11px] font-normal text-muted/80">{contact}</span>
          ) : null}
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-normal text-muted">{preview}</span>
            <UnreadBadge count={conversation.unreadByAdmin} />
          </span>
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
