"use client";

import { useCallback, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useAdminSocket } from "@/hooks/use-admin-socket";
import { useConversations } from "@/hooks/use-conversations";
import { useAdminThread } from "@/hooks/use-admin-thread";
import { useAdminPresence } from "@/hooks/use-admin-presence";
import { useTyping } from "@/hooks/use-typing";
import ConversationList from "./ConversationList";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const STATUS_LABEL: Record<string, string> = {
  online: "Connected",
  connecting: "Connecting…",
  reconnecting: "Reconnecting…",
  offline: "Offline",
};

export default function AdminChat() {
  const { socketRef, connectionState } = useAdminSocket();
  const { conversations, loading: listLoading, refresh } = useConversations(socketRef);
  const onlineVisitorIds = useAdminPresence(socketRef);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { conversation, messages, typing, loading: threadLoading, sendReply } = useAdminThread(
    socketRef,
    selectedId,
    refresh
  );
  const { notifyTyping } = useTyping(socketRef, selectedId, "visitor");

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
        <h1 className="font-mono text-lg font-semibold text-white">Admin Chat</h1>
        <p className="text-xs text-muted">{STATUS_LABEL[connectionState] ?? connectionState}</p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`w-full shrink-0 overflow-hidden border-r border-line md:max-w-xs ${
            selectedId ? "hidden md:block" : "block"
          }`}
        >
          <ConversationList
            conversations={conversations}
            loading={listLoading}
            selectedId={selectedId}
            onlineVisitorIds={onlineVisitorIds}
            onSelect={setSelectedId}
          />
        </aside>

        <div className={`flex flex-1 flex-col ${selectedId ? "flex" : "hidden md:flex"}`}>
          {!conversation ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted">
              Select a candidate to view the conversation.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 border-b border-line md:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Back to conversations"
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-muted hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <ChatHeader
                conversation={conversation}
                online={onlineVisitorIds.has(conversation.visitorId)}
                onToggleStatus={handleToggleStatus}
              />
              <MessageList
                messages={messages}
                loading={threadLoading}
                typingLabel={typing ? "Candidate is typing…" : null}
              />
              <MessageInput onSend={sendReply} onTyping={notifyTyping} placeholder="Reply to candidate…" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
