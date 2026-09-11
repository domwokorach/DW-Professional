"use client";

import { useCallback, useState } from "react";
import { useAdminSocket } from "@/hooks/use-admin-socket";
import { useConversations } from "@/hooks/use-conversations";
import { useAdminThread } from "@/hooks/use-admin-thread";
import ConversationList from "./ConversationList";
import ConversationThread from "./ConversationThread";

const STATUS_LABEL: Record<string, string> = {
  online: "Connected",
  connecting: "Connecting…",
  reconnecting: "Reconnecting…",
  offline: "Offline",
};

export default function AdminLiveChat() {
  const { socketRef, connectionState } = useAdminSocket();
  const { conversations, loading: conversationsLoading, refresh } = useConversations(socketRef);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { conversation, messages, typing, loading: threadLoading, sendReply } = useAdminThread(
    socketRef,
    selectedId,
    refresh
  );

  const handleToggleStatus = useCallback(async () => {
    if (!conversation) return;
    const nextStatus = conversation.status === "closed" ? "open" : "closed";
    const res = await fetch(`/api/chat/conversations/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) refresh();
  }, [conversation, refresh]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h1 className="font-mono text-lg font-semibold text-white">Live Chat</h1>
        <p className="text-xs text-muted">{STATUS_LABEL[connectionState] ?? connectionState}</p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-full max-w-xs shrink-0 overflow-hidden border-r border-line">
          <ConversationList
            conversations={conversations}
            loading={conversationsLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>

        <ConversationThread
          conversation={conversation}
          messages={messages}
          typing={typing}
          loading={threadLoading}
          onSend={sendReply}
          onToggleStatus={handleToggleStatus}
        />
      </div>
    </div>
  );
}
