"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useAdminSocket } from "@/hooks/use-admin-socket";
import { useConversations } from "@/hooks/use-conversations";
import { useAdminThread } from "@/hooks/use-admin-thread";
import { useLocale } from "@/i18n/LocaleProvider";
import ConnectionStatus from "@/components/chat/ConnectionStatus";
import OnlineStatus from "@/components/chat/OnlineStatus";
import ConversationList from "./ConversationList";
import ConversationThread from "./ConversationThread";

export default function AdminLiveChat({ adminName, adminEmail }: { adminName: string; adminEmail: string }) {
  const { socketRef, connectionState } = useAdminSocket();
  const { conversations, loading: conversationsLoading, refresh } = useConversations(socketRef, connectionState);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { conversation, messages, typing, loading: threadLoading, sendReply } = useAdminThread(
    socketRef,
    selectedId,
    connectionState,
    refresh
  );
  const { signOut } = useClerk();
  const router = useRouter();
  const { localiseHref } = useLocale();

  const handleSignOut = useCallback(() => {
    signOut(() => router.push(localiseHref("/")));
  }, [signOut, router, localiseHref]);

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
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="min-w-0">
          <h1 className="font-mono text-lg font-semibold text-white">Live Chat</h1>
          <div className="mt-0.5 truncate text-xs text-muted">
            Signed in as <span className="text-white">{adminName}</span>
            {adminEmail ? <span className="hidden sm:inline"> · {adminEmail}</span> : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <OnlineStatus online={connectionState === "online"} />
          <ConnectionStatus state={connectionState} />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-white transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign Out
          </button>
        </div>
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
          sendDisabled={connectionState !== "online"}
          sendDisabledHint={connectionState === "unauthorized" ? "Session expired" : "Reconnecting…"}
        />
      </div>
    </div>
  );
}
