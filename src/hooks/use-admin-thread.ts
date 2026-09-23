"use client";

import { toast } from "sonner";
import { mergeMessages as mergeById } from "@/lib/chat/merge-messages";
import { sendClientMessage } from "@/lib/chat/send-client-message";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatSocket } from "@/lib/socket/client";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { generateId } from "@/lib/utils/generate-id";
import type { ChatMessage } from "@/types/message";
import type { ConversationWithMessages } from "@/types/conversation";
import type { ConnectionState } from "@/types/chat";
import type {
  ConversationStatusPayload,
  MessageDeletedPayload,
  MessageEventPayload,
  TypingEventPayload,
} from "@/types/socket";


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
  const remoteTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchConversation = useCallback((id: string) => {
    return fetch(`/api/chat/conversations/${id}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ conversation: ConversationWithMessages }>) : Promise.reject(res)))
      .then(({ conversation: loaded }) => loaded)
      .catch(() => { toast.error("Unable to load this conversation. Please try again."); return null; });
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
        setMessages((prev) => mergeById(prev, loaded.messages));
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

    let cancelled = false;
    if (!wasOnline.current) {
      fetchConversation(conversationId).then((loaded) => {
        if (!loaded || cancelled) return;
        setConversation(loaded);
        setMessages((prev) => mergeById(prev, loaded.messages));
      });
    }
    wasOnline.current = true;
    return () => { cancelled = true; };
  }, [socketRef, conversationId, connectionState, fetchConversation]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;

    const handleMessage = ({ message, clientMessageId }: MessageEventPayload) => {
      if (message.conversationId !== conversationId) return;
      setTyping(false);
      setMessages((prev) => mergeById(prev, [{ ...message, clientMessageId: clientMessageId ?? message.clientMessageId }]));
    };

    const handleTyping = (payload: TypingEventPayload) => {
      if (payload.conversationId !== conversationId || payload.sender !== "visitor") return;
      setTyping(payload.isTyping);
      if (remoteTypingTimer.current) clearTimeout(remoteTypingTimer.current);
      if (payload.isTyping) remoteTypingTimer.current = setTimeout(() => setTyping(false), 6000);
    };

    const handleMessageDeleted = (payload: MessageDeletedPayload) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId ? { ...m, deleted: true, content: "" } : m))
      );
    };

    const handleStatus = (payload: ConversationStatusPayload) => {
      if (payload.conversationId !== conversationId) return;
      setConversation((prev) => (prev ? { ...prev, status: payload.status } : prev));
    };

    const handleReceipt = (payload: { conversationId: string; reader: "visitor" | "admin"; readAt: string }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((previous) => previous.map((message) =>
        message.sender !== payload.reader && message.sender !== "bot" && message.createdAt <= payload.readAt
          ? { ...message, status: "read" } : message));
    };
    socket.on("chat:receipt", handleReceipt);
    socket.on(SOCKET_EVENTS.MESSAGE, handleMessage);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.CONVERSATION_STATUS, handleStatus);
    return () => {
      socket.off("chat:receipt", handleReceipt);
      socket.off(SOCKET_EVENTS.MESSAGE, handleMessage);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
      if (remoteTypingTimer.current) clearTimeout(remoteTypingTimer.current);
      setTyping(false);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.CONVERSATION_STATUS, handleStatus);
    };
  }, [socketRef, conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    const markVisible = () => {
      if (document.visibilityState === "visible" && socketRef.current?.connected) {
        socketRef.current.emit(SOCKET_EVENTS.READ, { conversationId, reader: "admin" });
      }
    };
    markVisible();
    document.addEventListener("visibilitychange", markVisible);
    return () => document.removeEventListener("visibilitychange", markVisible);
  }, [conversationId, connectionState, messages.length, socketRef]);

  useEffect(() => {
    const receivePersisted = (event: Event) => {
      const message = (event as CustomEvent<ChatMessage>).detail;
      if (message.conversationId === conversationId) setMessages((previous) => mergeById(previous, [message]));
    };
    window.addEventListener("chat:persisted-message", receivePersisted);
    return () => window.removeEventListener("chat:persisted-message", receivePersisted);
  }, [conversationId]);

  const sendReply = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !conversationId) return;

      const socket = socketRef.current;

      const clientMessageId = generateId();
      const optimistic: ChatMessage = {
        id: clientMessageId,
        conversationId,
        sender: "admin",
        content: trimmed,
        status: "sent",
        localStatus: "sending",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      const deliver = async () => {
        setMessages((prev) => prev.map((message) => message.id === clientMessageId ? { ...message, localStatus: "sending" } : message));
        try {
          const message = await sendClientMessage(socketRef.current, { conversationId, content: trimmed, clientMessageId });
          setMessages((prev) => mergeById(prev, [{ ...message, clientMessageId }]));
        } catch (error) {
          setMessages((prev) => prev.map((message) => message.id === clientMessageId ? { ...message, localStatus: "failed" } : message));
          toast.error(error instanceof Error ? error.message : "Message failed to send.", {
            action: { label: "Retry", onClick: () => void deliver() }, duration: Infinity,
          });
        }
      };
      void deliver();
      if (socket?.connected) socket.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
    },
    [socketRef, conversationId]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!conversationId) return;
      const socket = socketRef.current;
      if (!socket?.connected) return;
      socket.emit(SOCKET_EVENTS.DELETE_MESSAGE, { conversationId, messageId });
    },
    [socketRef, conversationId]
  );

  const setStatus = useCallback(
    (status: "open" | "closed") => {
      if (!conversationId) return;
      const socket = socketRef.current;
      if (!socket?.connected) return;
      socket.emit(SOCKET_EVENTS.SET_STATUS, { conversationId, status });
    },
    [socketRef, conversationId]
  );

  return { conversation, messages, typing, loading, sendReply, deleteMessage, setStatus };
}
