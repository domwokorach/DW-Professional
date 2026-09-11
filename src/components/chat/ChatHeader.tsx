import type { Conversation } from "@/types/chat";
import OnlineStatus from "./OnlineStatus";

export default function ChatHeader({
  conversation,
  online,
  onToggleStatus,
}: {
  conversation: Conversation;
  online: boolean;
  onToggleStatus?: () => void;
}) {
  const displayName = conversation.name || conversation.visitorId;

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div>
        <p className="font-mono text-sm font-semibold text-white">{displayName}</p>
        {conversation.email ? <p className="text-xs text-muted">{conversation.email}</p> : null}
        <OnlineStatus online={online} />
      </div>
      {onToggleStatus ? (
        <button
          type="button"
          onClick={onToggleStatus}
          className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:text-white"
        >
          {conversation.status === "closed" ? "Reopen" : "Close"}
        </button>
      ) : null}
    </header>
  );
}
