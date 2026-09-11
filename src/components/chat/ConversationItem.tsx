import type { Conversation } from "@/types/chat";
import { formatChatDate, getMessagePreview } from "@/lib/chat/helpers";
import CandidateAvatar from "./CandidateAvatar";
import OnlineStatus from "./OnlineStatus";
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
  const displayName = conversation.name || conversation.email || conversation.visitorId;
  const preview = conversation.lastMessagePreview
    ? getMessagePreview(conversation.lastMessagePreview, 48)
    : "No messages yet";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      aria-label={`Open conversation with ${displayName}${
        conversation.unreadByAdmin > 0 ? `, ${conversation.unreadByAdmin} unread messages` : ""
      }${online ? ", online" : ", offline"}`}
      className={`flex w-full min-h-11 items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface ${
        selected ? "bg-surface" : ""
      }`}
    >
      <CandidateAvatar label={displayName} className="mt-0.5 hidden h-9 w-9 shrink-0 sm:flex" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-white">{displayName}</span>
          <span className="shrink-0 text-[11px] text-muted">
            {formatChatDate(conversation.lastMessageAt ?? conversation.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">{preview}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <OnlineStatus online={online} />
          <UnreadBadge count={conversation.unreadByAdmin} />
        </div>
      </div>
    </button>
  );
}
