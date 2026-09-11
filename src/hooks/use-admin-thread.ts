"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatSocket } from "@/lib/socket/client";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import type { ChatMessage } from "@/types/message";
import type { ConversationWithMessages } from "@/types/conversation";
import type { ConnectionState } from "@/types/chat";
import type { MessageEventPayload, TypingEventPayload } from "@/types/socket";

function mergeById(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(prev.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Admin-side thread state for one selected conversation: history + realtime messages/typing + reply. */
export function useAdminThread(
  socketRef: React.RefObject<ChatSocket | null>,
  conversationId: string | null,
  connectionState: ConnectionState,
  onRead?: () => void
) {
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchConversation = useCallback((id: string) => {
    return fetch(`/api/chat/conversations/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(({ conversation: loaded }: { conversation: ConversationWithMessages }) => loaded)
      .catch(() => null);
  }, []);

  useEffect(() => {
    setConversation(null);
    setMessages([]);
    setTyping(false);
    if (!conversationId) return;

    let cancelled = false;
    setLoading(true);

    fetchConversation(conversationId)
      .then((loaded) => {
        if (cancelled || !loaded) return;
        setConversation(loaded);
        setMessages(loaded.messages);
        onRead?.();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // onRead is intentionally excluded: a new function identity per render
    // must not re-trigger the fetch for the same conversationId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, fetchConversation]);

  // Room membership from a previous socket connection is not carried over
  // by Socket.IO, so the selected conversation's room must be re-joined on
  // every reconnect, not just when the admin picks a different one. A
  // dropped connection can also mean messages arrived that this client
  // never saw as live events, so a reconnect also re-fetches and merges the
  // thread (deduped by message id) rather than trusting the socket alone.
  const wasOnline = useRef(false);
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId || connectionState !== "online") {
      if (connectionState !== "online") wasOnline.current = false;
      return;
    }

    socket.emit(SOCKET_EVENTS.JOIN, { conversationId });

    if (!wasOnline.current) {
      fetchConversation(conversationId).then((loaded) => {
        if (!loaded) return;
        setConversation(loaded);
        setMessages((prev) => mergeById(prev, loaded.messages));
      });
    }
    wasOnline.current = true;
  }, [socketRef, conversationId, connectionState, fetchConversation]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;

    const handleMessage = ({ message }: MessageEventPayload) => {
      if (message.conversationId !== conversationId) return;
      setTyping(false);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };

    const handleTyping = (payload: TypingEventPayload) => {
      if (payload.conversationId !== conversationId || payload.sender !== "visitor") return;
      setTyping(payload.isTyping);
    };

    socket.on(SOCKET_EVENTS.MESSAGE, handleMessage);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE, handleMessage);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
    };
  }, [socketRef, conversationId]);

  const sendReply = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !conversationId) return;

      const socket = socketRef.current;
      if (!socket?.connected) return;
      socket.emit(SOCKET_EVENTS.REPLY, { conversationId, content: trimmed });
    },
    [socketRef, conversationId]
  );

  return { conversation, messages, typing, loading, sendReply };
}
