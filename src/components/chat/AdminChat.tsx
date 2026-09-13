"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import ConnectionStatus, { ConnectionBanner } from "./ConnectionStatus";
import { SidebarProvider } from "@/components/animate-ui/components/radix/sidebar";
import { cn } from "@/lib/utils";
import { useAdminSocket } from "@/hooks/use-admin-socket";
import { useConversations } from "@/hooks/use-conversations";
import { useAdminThread } from "@/hooks/use-admin-thread";
import { useAdminPresence } from "@/hooks/use-admin-presence";
import { useAdminActivity } from "@/hooks/use-admin-activity";
import { useTyping } from "@/hooks/use-typing";
import { useSignOut } from "@/hooks/use-sign-out";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import ConversationList from "./ConversationList";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import CustomerDetails from "./CustomerDetails";
import type { ConnectionState } from "@/types/chat";

export default function AdminChat({
  adminId,
  adminName,
  adminEmail,
}: {
  adminId: string;
  adminName: string;
  adminEmail: string;
}) {
  const { socketRef, connectionState } = useAdminSocket();
  const {
    conversations,
    loading: listLoading,
    error: listError,
    refresh,
  } = useConversations(socketRef, connectionState);
  const onlineVisitorIds = useAdminPresence(socketRef);
  useAdminActivity(socketRef);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { conversation, messages, typing, loading: threadLoading, sendReply } = useAdminThread(
    socketRef,
    selectedId,
    connectionState,
    refresh
  );
  const { notifyTyping } = useTyping(socketRef, selectedId, "visitor");
  const { signOut } = useSignOut();

  // Tells the server (and thus the candidate) that an admin has opened this
  // specific conversation — drives the "waiting for admin" → "admin joined"
  // transition. Re-fires on reconnect too, matching connectionState !==
  // "online" being the only thing that ever tears the socket room down.
  useEffect(() => {
    if (!selectedId || connectionState !== "online") return;
    socketRef.current?.emit(SOCKET_EVENTS.ADMIN_OPEN, { conversationId: selectedId });
  }, [socketRef, selectedId, connectionState]);

  const handleSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

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
    <SidebarProvider className="contents">
      <ChatShell
        adminId={adminId}
        adminName={adminName}
        adminEmail={adminEmail}
        connectionState={connectionState}
        conversations={conversations}
        listLoading={listLoading}
        listError={listError}
        refresh={refresh}
        onlineVisitorIds={onlineVisitorIds}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        conversation={conversation}
        messages={messages}
        typing={typing}
        threadLoading={threadLoading}
        sendReply={sendReply}
        notifyTyping={notifyTyping}
        onSignOut={handleSignOut}
        onToggleStatus={handleToggleStatus}
        onMarkUnread={handleMarkUnread}
      />
    </SidebarProvider>
  );
}

function ChatShell({
  adminId,
  adminName,
  adminEmail,
  connectionState,
  conversations,
  listLoading,
  listError,
  refresh,
  onlineVisitorIds,
  selectedId,
  setSelectedId,
  conversation,
  messages,
  typing,
  threadLoading,
  sendReply,
  notifyTyping,
  onSignOut,
  onToggleStatus,
  onMarkUnread,
}: {
  adminId: string;
  adminName: string;
  adminEmail: string;
  connectionState: ConnectionState;
  conversations: ReturnType<typeof useConversations>["conversations"];
  listLoading: boolean;
  listError: boolean;
  refresh: () => void;
  onlineVisitorIds: Set<string>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  conversation: ReturnType<typeof useAdminThread>["conversation"];
  messages: ReturnType<typeof useAdminThread>["messages"];
  typing: boolean;
  threadLoading: boolean;
  sendReply: (content: string) => void;
  notifyTyping: () => void;
  onSignOut: () => void;
  onToggleStatus: () => void;
  onMarkUnread: () => void;
}) {
  // Mobile has no room for list + conversation side by side, so the two
  // panes are toggled by `selectedId` via CSS breakpoints instead of an
  // overlay/drawer — at md+ both are always visible regardless of selection.
  const handleSelect = useCallback((id: string) => setSelectedId(id), [setSelectedId]);
  const handleBack = useCallback(() => setSelectedId(null), [setSelectedId]);

  const isClosed = conversation?.status === "closed";
  const composerDisabledHint = isClosed
    ? "This conversation has ended."
    : connectionState === "unauthorized"
      ? "Session expired"
      : "Reconnecting…";

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* AdminShell already renders its own "Admin Chat" bar below md, so this
          title row would otherwise duplicate it — only shown at md+ where
          AdminShell's app-level nav lives in a permanent side rail instead. */}
      <header className="hidden shrink-0 items-center gap-3 border-b border-line px-4 py-3 sm:px-6 md:flex">
        <h1 className="min-w-0 flex-1 truncate font-mono text-base font-semibold text-white sm:text-lg">
          Admin Chat
        </h1>
        <ConnectionStatus state={connectionState} />
      </header>
      <ConnectionBanner state={connectionState} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "min-h-0 flex-col md:flex md:w-[280px] md:shrink-0 lg:w-[320px]",
            selectedId ? "hidden md:flex" : "flex w-full"
          )}
        >
          <ConversationList
            conversations={conversations}
            loading={listLoading}
            error={listError}
            onRetry={refresh}
            selectedId={selectedId}
            onlineVisitorIds={onlineVisitorIds}
            adminName={adminName}
            adminEmail={adminEmail}
            currentAdminId={adminId}
            onSelect={handleSelect}
            onSignOut={onSignOut}
          />
        </div>

        <div className="flex min-w-0 flex-1 min-[1200px]:grid min-[1200px]:grid-cols-[minmax(0,1fr)_320px]">
          <div
            className={cn(
              "min-h-0 min-w-0 flex-col",
              selectedId ? "flex" : "hidden md:flex"
            )}
          >
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
                  currentAdminId={adminId}
                  currentAdminName={adminName}
                  onBack={handleBack}
                  onToggleStatus={onToggleStatus}
                  onMarkUnread={onMarkUnread}
                />
                <MessageList
                  messages={messages}
                  loading={threadLoading}
                  typingLabel={typing ? `${conversation.name || "Candidate"} is typing…` : null}
                />
                <MessageInput
                  onSend={sendReply}
                  onTyping={notifyTyping}
                  placeholder={isClosed ? "This conversation has ended." : "Reply to candidate…"}
                  disabled={connectionState !== "online"}
                  disabledHint={composerDisabledHint}
                  closed={isClosed}
                />
              </>
            )}
          </div>

          {conversation ? (
            <aside className="hidden min-h-0 border-l border-line min-[1200px]:block">
              <CustomerDetails
                conversation={conversation}
                online={onlineVisitorIds.has(conversation.visitorId)}
                currentAdminId={adminId}
                currentAdminName={adminName}
              />
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
