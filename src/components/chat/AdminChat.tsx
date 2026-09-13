"use client";

import { useCallback, useState } from "react";
import { MessageSquare } from "lucide-react";
import ConnectionStatus from "./ConnectionStatus";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/animate-ui/components/radix/sidebar";
import { useAdminSocket } from "@/hooks/use-admin-socket";
import { useConversations } from "@/hooks/use-conversations";
import { useAdminThread } from "@/hooks/use-admin-thread";
import { useAdminPresence } from "@/hooks/use-admin-presence";
import { useTyping } from "@/hooks/use-typing";
import { useSignOut } from "@/hooks/use-sign-out";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { conversation, messages, typing, loading: threadLoading, sendReply } = useAdminThread(
    socketRef,
    selectedId,
    connectionState,
    refresh
  );
  const { notifyTyping } = useTyping(socketRef, selectedId, "visitor");
  const { signOut } = useSignOut();

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
    <SidebarProvider
      className="contents"
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      style={{ "--sidebar-width": "19rem" } as React.CSSProperties}
    >
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
  const { isMobile, setOpenMobile } = useSidebar();

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (isMobile) setOpenMobile(false);
    },
    [isMobile, setOpenMobile, setSelectedId]
  );

  const handleBack = useCallback(() => {
    if (isMobile) {
      setOpenMobile(true);
    } else {
      setSelectedId(null);
    }
  }, [isMobile, setOpenMobile, setSelectedId]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
        <SidebarTrigger aria-label="Toggle candidate list" />
        <h1 className="min-w-0 flex-1 truncate font-mono text-base font-semibold text-white sm:text-lg">
          Admin Chat
        </h1>
        <ConnectionStatus state={connectionState} />
      </header>

      <div className="flex min-h-0 flex-1">
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

        <div className="flex min-w-0 flex-1 lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
          <div className="flex h-full min-h-0 min-w-0 flex-col">
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

          {conversation ? (
            <aside className="hidden h-full min-h-0 border-l border-line lg:block">
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
