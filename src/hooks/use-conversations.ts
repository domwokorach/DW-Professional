"use client";

import { compareConversations } from "@/lib/chat/helpers";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatSocket } from "@/lib/socket/client";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { traceChat } from "@/lib/chat/trace";
import type { Conversation } from "@/types/conversation";
import type { ConnectionState } from "@/types/chat";
import type { ConversationEventPayload } from "@/types/socket";

/**
 * Admin-side conversation list: fetched once, then kept live via
 * chat:new-conversation / chat:conversation-updated, and re-fetched whenever
 * the socket comes back online after a drop — any conversation created or
 * updated while disconnected only reaches the client as a live event, which
 * was missed, so it would otherwise never appear.
 */
export function useConversations(
  socketRef: React.RefObject<ChatSocket | null>,
  connectionState: ConnectionState
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const { conversations: list } = (await res.json()) as { conversations: Conversation[] };
        setConversations(list.sort(compareConversations));
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const wasOnline = useRef(false);
  useEffect(() => {
    if (connectionState === "online" && !wasOnline.current) {
      wasOnline.current = true;
      refresh();
    } else if (connectionState !== "online") {
      wasOnline.current = false;
    }
  }, [connectionState, refresh]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const upsert = ({ conversation }: ConversationEventPayload) => {
      traceChat("admin:receive_conversation_update", { conversationId: conversation.id });
      setConversations((prev) => {
        const others = prev.filter((c) => c.id !== conversation.id);
        return [conversation, ...others].sort(compareConversations);
      });
    };

    socket.on(SOCKET_EVENTS.NEW_CONVERSATION, upsert);
    socket.on(SOCKET_EVENTS.CONVERSATION_UPDATED, upsert);
    return () => {
      socket.off(SOCKET_EVENTS.NEW_CONVERSATION, upsert);
      socket.off(SOCKET_EVENTS.CONVERSATION_UPDATED, upsert);
    };
    // `socketRef` alone never changes identity, so without `connectionState`
    // this would only ever attach once at mount — and if `socketRef.current`
    // was still null at that first render (the socket hadn't been created
    // yet), these listeners would never attach for the component's
    // lifetime. Re-running on every connection-state change makes
    // (re)attaching self-healing instead of a one-shot snapshot.
  }, [socketRef, connectionState]);

  return { conversations, loading, error, refresh };
}
