"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { SidebarProvider } from "@/components/animate-ui/components/radix/sidebar";
import { useAdminSocket } from "@/hooks/use-admin-socket";
import { useConversations } from "@/hooks/use-conversations";
import { useAdminThread } from "@/hooks/use-admin-thread";
import { useAdminPresence } from "@/hooks/use-admin-presence";
import { useTyping } from "@/hooks/use-typing";
import { useLocale } from "@/i18n/LocaleProvider";
import ConversationList from "./ConversationList";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function AdminChat({ adminName, adminEmail }: { adminName: string; adminEmail: string }) {
  const { socketRef, connectionState } = useAdminSocket();
  const { conversations, loading: listLoading, refresh } = useConversations(socketRef, connectionState);
  const onlineVisitorIds = useAdminPresence(socketRef);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { conversation, messages, typing, loading: threadLoading, sendReply } = useAdminThread(
    socketRef,
    selectedId,
    connectionState,
    refresh
  );
  const { notifyTyping } = useTyping(socketRef, selectedId, "visitor");
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

  const handleMarkUnread = useCallback(async () => {
    if (!conversation) return;
    const res = await fetch(`/api/chat/conversations/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markUnread: true }),
    });
    if (res.ok) refresh();
  }, [conversation, refresh]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center border-b border-line px-4 py-3 sm:px-6">
        <h1 className="font-mono text-base font-semibold text-white sm:text-lg">Admin Chat</h1>
      </header>

      <SidebarProvider className="contents">
        <div className="min-h-0 flex-1 md:grid md:grid-cols-[260px_1fr] lg:grid-cols-[320px_1fr]">
          <ConversationList
            conversations={conversations}
            loading={listLoading}
            selectedId={selectedId}
            onlineVisitorIds={onlineVisitorIds}
            connectionState={connectionState}
            adminName={adminName}
            adminEmail={adminEmail}
            onSelect={setSelectedId}
            onSignOut={handleSignOut}
            className={`h-full w-full border-line md:border-r ${selectedId ? "hidden" : "flex"} md:flex`}
          />

          <div className={`flex h-full min-h-0 flex-col ${selectedId ? "flex" : "hidden md:flex"}`}>
          {!conversation ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <MessageSquare className="h-10 w-10 text-muted" aria-hidden="true" />
              <p className="text-sm font-medium text-white">Select a conversation</p>
              <p className="max-w-xs text-sm text-muted">
                Choose a candidate from the conversation list to view and reply to their messages.
              </p>
            </div>
          ) : (
            <>
              <ChatHeader
                conversation={conversation}
                online={onlineVisitorIds.has(conversation.visitorId)}
                onBack={() => setSelectedId(null)}
                onToggleStatus={handleToggleStatus}
                onMarkUnread={handleMarkUnread}
              />
              <MessageList
                messages={messages}
                loading={threadLoading}
                typingLabel={typing ? "Candidate is typing…" : null}
              />
              <MessageInput
                onSend={sendReply}
                onTyping={notifyTyping}
                placeholder="Reply to candidate…"
                disabled={connectionState !== "online"}
                disabledHint={connectionState === "unauthorized" ? "Session expired" : "Reconnecting…"}
              />
            </>
          )}
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
