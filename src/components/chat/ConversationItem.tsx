import type { Conversation } from "@/types/chat";
import { formatChatDate } from "@/lib/chat/helpers";
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

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface ${
        selected ? "bg-surface" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-white">{displayName}</span>
        <span className="shrink-0 text-[11px] text-muted">
          {formatChatDate(conversation.lastMessageAt ?? conversation.createdAt)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <OnlineStatus online={online} />
        <UnreadBadge count={conversation.unreadByAdmin} />
      </div>
    </button>
  );
}
