"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "./use-socket";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { CONVERSATION_ID_STORAGE_KEY, VISITOR_ID_STORAGE_KEY } from "@/config/chat";
import { generateId } from "@/lib/utils/generate-id";
import type { ChatMessage } from "@/types/message";
import type { MessageEventPayload, TypingEventPayload } from "@/types/socket";

function getVisitorId(): string {
  if (typeof window === "undefined") return "visitor";
  let id = window.sessionStorage.getItem(VISITOR_ID_STORAGE_KEY);
  if (!id) {
    id = generateId();
    window.sessionStorage.setItem(VISITOR_ID_STORAGE_KEY, id);
  }
  return id;
}

/** Candidate-facing chat state: creates/loads the visitor's conversation, then owns realtime messages, typing, and sending. */
export function useLiveChat() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [ready, setReady] = useState(false);

  const fetchToken = useCallback(async () => {
    const res = await fetch("/api/chat/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId() }),
    });
    if (!res.ok) throw new Error("Unable to fetch chat token");
    const { token } = (await res.json()) as { token: string };
    return token;
  }, []);

  const { socketRef, connectionState } = useSocket(fetchToken);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const conversationRes = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getVisitorId() }),
      });
      if (!conversationRes.ok || cancelled) return;
      const { conversation } = (await conversationRes.json()) as { conversation: { id: string } };
      if (cancelled) return;

      setConversationId(conversation.id);
      window.sessionStorage.setItem(CONVERSATION_ID_STORAGE_KEY, conversation.id);

      const messagesRes = await fetch(`/api/chat/messages?conversationId=${conversation.id}`);
      if (!messagesRes.ok || cancelled) return;
      const { messages: history } = (await messagesRes.json()) as { messages: ChatMessage[] };
      if (!cancelled) {
        setMessages(history);
        setReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId || connectionState !== "online") return;
    socket.emit(SOCKET_EVENTS.JOIN, { conversationId });
  }, [socketRef, conversationId, connectionState]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleMessage = ({ message, clientMessageId }: MessageEventPayload) => {
      if (message.conversationId !== conversationId) return;
      setTyping(false);
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        if (clientMessageId) {
          const optimisticIndex = prev.findIndex((m) => m.id === clientMessageId);
          if (optimisticIndex !== -1) {
            const next = prev.slice();
            next[optimisticIndex] = message;
            return next;
          }
        }
        return [...prev, message];
      });
    };

    const handleTyping = (payload: TypingEventPayload) => {
      if (payload.conversationId !== conversationId || payload.sender !== "admin") return;
      setTyping(payload.isTyping);
    };

    socket.on(SOCKET_EVENTS.MESSAGE, handleMessage);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE, handleMessage);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
    };
  }, [socketRef, conversationId]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !conversationId) return;

      const optimistic: ChatMessage = {
        id: generateId(),
        conversationId,
        sender: "visitor",
        content: trimmed,
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      const socket = socketRef.current;
      if (!socket?.connected) return;
      socket.emit(SOCKET_EVENTS.MESSAGE, {
        conversationId,
        content: trimmed,
        clientMessageId: optimistic.id,
      });
    },
    [socketRef, conversationId]
  );

  return { connectionState, messages, typing, sendMessage, ready, conversationId };
}
