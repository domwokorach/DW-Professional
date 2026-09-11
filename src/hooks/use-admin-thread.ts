"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatSocket } from "@/lib/socket/client";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import type { ChatMessage } from "@/types/message";
import type { ConversationWithMessages } from "@/types/conversation";
import type { MessageEventPayload, TypingEventPayload } from "@/types/socket";

/** Admin-side thread state for one selected conversation: history + realtime messages/typing + reply. */
export function useAdminThread(
  socketRef: React.RefObject<ChatSocket | null>,
  conversationId: string | null,
  onRead?: () => void
) {
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setConversation(null);
    setMessages([]);
    setTyping(false);
    if (!conversationId) return;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/chat/conversations/${conversationId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(({ conversation: loaded }: { conversation: ConversationWithMessages }) => {
        if (cancelled) return;
        setConversation(loaded);
        setMessages(loaded.messages);
        onRead?.();
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // onRead is intentionally excluded: a new function identity per render
    // must not re-trigger the fetch for the same conversationId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;
    socket.emit(SOCKET_EVENTS.JOIN, { conversationId });
  }, [socketRef, conversationId]);

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
