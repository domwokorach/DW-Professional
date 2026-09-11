"use client";

import type { Conversation } from "@/types/chat";

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
    new Date(value)
  );
}

export default function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (loading && conversations.length === 0) {
    return <p className="p-4 text-sm text-muted">Loading conversations…</p>;
  }

  if (conversations.length === 0) {
    return <p className="p-4 text-sm text-muted">No conversations yet.</p>;
  }

  return (
    <ul className="divide-y divide-line overflow-y-auto">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedId;
        const preview = conversation.name || conversation.email || conversation.visitorId;

        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface ${
                isSelected ? "bg-surface" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-white">{preview}</span>
                <span className="shrink-0 text-[11px] text-muted">
                  {formatTimestamp(conversation.lastMessageAt ?? conversation.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-muted">
                  {conversation.status === "closed" ? "Closed" : "Open"}
                </span>
                {conversation.unreadByAdmin > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-none text-ink">
                    {conversation.unreadByAdmin > 9 ? "9+" : conversation.unreadByAdmin}
                  </span>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
