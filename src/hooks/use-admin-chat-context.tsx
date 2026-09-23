"use client";

import { createContext, useContext, useMemo, useEffect } from "react";
import { useAdminSocket } from "./use-admin-socket";
import { useConversations } from "./use-conversations";
import type { ChatSocket } from "@/lib/socket/client";
import type { ConnectionState } from "@/types/chat";
import type { Conversation } from "@/types/conversation";

interface AdminChatContextValue {
  socketRef: React.RefObject<ChatSocket | null>;
  connectionState: ConnectionState;
  conversations: Conversation[];
  listLoading: boolean;
  listError: boolean;
  refresh: () => Promise<void>;
}

const AdminChatContext = createContext<AdminChatContextValue | null>(null);

/**
 * Owns the admin's single realtime connection and conversation list at the
 * `/admin` layout level (mounted once, above every admin page) instead of
 * inside the chat page itself. That's what lets a new-message popup/badge
 * (see AdminChatNotifications) fire while the admin is viewing another
 * admin page, and guarantees only one Socket.IO connection ever exists per
 * tab regardless of how many chat-related components are mounted.
 */
export function AdminChatProvider({ children }: { children: React.ReactNode }) {
  const { socketRef, connectionState } = useAdminSocket();
  const {
    conversations,
    loading: listLoading,
    error: listError,
    refresh,
  } = useConversations(socketRef, connectionState);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const delivered = ({ message }: import("@/types/socket").MessageEventPayload) => {
      if (message.sender === "visitor" && message.status === "sent") socket.emit("chat:delivered", { conversationId: message.conversationId, messageId: message.id });
    };
    socket.on("chat:message", delivered);
    return () => { socket.off("chat:message", delivered); };
  }, [socketRef, connectionState]);

  const value = useMemo(
    () => ({ socketRef, connectionState, conversations, listLoading, listError, refresh }),
    [socketRef, connectionState, conversations, listLoading, listError, refresh]
  );

  return <AdminChatContext.Provider value={value}>{children}</AdminChatContext.Provider>;
}

export function useAdminChatContext(): AdminChatContextValue {
  const ctx = useContext(AdminChatContext);
  if (!ctx) throw new Error("useAdminChatContext must be used within AdminChatProvider");
  return ctx;
}
