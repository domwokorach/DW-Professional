"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "./use-socket";
import { ChatUnavailableError } from "@/lib/socket/errors";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { CONVERSATION_ID_STORAGE_KEY, REGISTERED_STORAGE_KEY, TYPING_DEBOUNCE_MS } from "@/lib/chat/constants";
import { generateId } from "@/lib/utils/generate-id";
import { getVisitorId } from "@/lib/chat/visitor-id";
import type { ChatMessage } from "@/types/message";
import type {
  AdminJoinedPayload,
  AdminPresenceState,
  AdminStatusPayload,
  ConversationStatusPayload,
  MessageDeletedPayload,
  MessageEventPayload,
  TypingEventPayload,
} from "@/types/socket";

export type CandidateDetails = {
  name: string;
  email: string;
  mobile: string;
  companyName: string;
};

function hasStoredIdentity(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(REGISTERED_STORAGE_KEY) === "1";
}

function mergeById(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(prev.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Candidate-facing chat state: gates on registration, then creates/loads the visitor's conversation and owns realtime messages, typing, and sending. */
export function useLiveChat() {
  // Lazy-initialised from sessionStorage so a same-tab refresh mid-conversation
  // skips the registration form again (the conversation itself is still
  // restored by visitorId, unchanged from before) — a brand new tab/session
  // has no visitorId yet and always sees the registration form first.
  const [hasIdentity, setHasIdentity] = useState(hasStoredIdentity);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [ready, setReady] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<AdminPresenceState>("offline");
  const [adminJoined, setAdminJoined] = useState(false);
  const [conversationStatus, setConversationStatus] = useState<"open" | "closed">("open");
  const [pendingMessageIds, setPendingMessageIds] = useState<Set<string>>(new Set());
  const pendingDetailsRef = useRef<CandidateDetails | null>(null);
  const outboxRef = useRef<Map<string, { conversationId: string; content: string }>>(new Map());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchToken = useCallback(async () => {
    const res = await fetch("/api/chat/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId() }),
    });
    // A 400/503 means the request itself is rejected (bad visitorId, or live
    // chat not configured server-side) — retrying with the same payload can
    // never succeed, unlike a transient network/5xx failure.
    if (res.status === 400 || res.status === 503) throw new ChatUnavailableError();
    if (!res.ok) throw new Error("Unable to fetch chat token");
    const { token } = (await res.json()) as { token: string };
    return token;
  }, []);

  const { socketRef, connectionState } = useSocket(fetchToken, hasIdentity);

  // Single path for both "returning to an active conversation" (pendingDetailsRef
  // empty) and "just registered" (pendingDetailsRef holds the submitted form) —
  // so both share the same success/failure handling instead of duplicating it.
  useEffect(() => {
    if (!hasIdentity) return;
    let cancelled = false;

    async function bootstrap() {
      const details = pendingDetailsRef.current;
      pendingDetailsRef.current = null;
      try {
        const conversationRes = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId: getVisitorId(), ...details }),
        });
        if (!conversationRes.ok) throw new Error("Unable to start chat");
        const { conversation } = (await conversationRes.json()) as {
          conversation: { id: string; assignedAdminId?: string | null; status?: "open" | "closed" };
        };
        if (cancelled) return;

        setConversationId(conversation.id);
        setAdminJoined(Boolean(conversation.assignedAdminId));
        setConversationStatus(conversation.status ?? "open");
        window.sessionStorage.setItem(CONVERSATION_ID_STORAGE_KEY, conversation.id);
        window.sessionStorage.setItem(REGISTERED_STORAGE_KEY, "1");

        const messagesRes = await fetch(
          `/api/chat/messages?conversationId=${conversation.id}&visitorId=${getVisitorId()}`
        );
        if (!messagesRes.ok) throw new Error("Unable to load chat history");
        const { messages: history } = (await messagesRes.json()) as { messages: ChatMessage[] };
        if (cancelled) return;

        setMessages(history);
        setReady(true);
        setRegistering(false);
      } catch {
        if (cancelled) return;
        setRegistering(false);
        // Only a fresh registration attempt gets bounced back to the form;
        // a failed silent restore (e.g. a flaky refresh) should not discard
        // an otherwise-valid session, so it's left to retry rather than reset.
        if (details) {
          setRegistrationError("Unable to start the chat. Please try again.");
          setHasIdentity(false);
          window.sessionStorage.removeItem(REGISTERED_STORAGE_KEY);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [hasIdentity]);

  const registerCandidate = useCallback((details: CandidateDetails) => {
    setRegistrationError(null);
    setRegistering(true);
    pendingDetailsRef.current = details;
    setHasIdentity(true);
  }, []);

  // Room membership does not survive a reconnect, so the conversation room
  // is re-joined on every transition back to "online". That same drop can
  // also mean a message arrived while disconnected and was never seen as a
  // live event, so a reconnect (not the very first connect) also re-fetches
  // and merges the conversation's persisted history, deduped by message id.
  const wasOnline = useRef(false);
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId || connectionState !== "online") {
      if (connectionState !== "online") wasOnline.current = false;
      return;
    }

    socket.emit(SOCKET_EVENTS.JOIN, { conversationId });

    if (wasOnline.current) {
      fetch(`/api/chat/messages?conversationId=${conversationId}&visitorId=${getVisitorId()}`)
        .then((res) => (res.ok ? (res.json() as Promise<{ messages: ChatMessage[] }>) : Promise.reject(res)))
        .then(({ messages: history }) => {
          setMessages((prev) => mergeById(prev, history));
        })
        .catch(() => {});
    }

    // Anything sent while disconnected/reconnecting was only ever queued
    // locally (see sendMessage's outbox below) — flush it now that a room
    // is joined again. The server dedupes by clientMessageId, so a message
    // that actually did get through before the drop is a safe no-op resend.
    for (const [clientMessageId, pending] of outboxRef.current) {
      if (pending.conversationId !== conversationId) continue;
      socket.emit(SOCKET_EVENTS.MESSAGE, {
        conversationId: pending.conversationId,
        content: pending.content,
        clientMessageId,
      });
    }

    wasOnline.current = true;
  }, [socketRef, conversationId, connectionState]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleMessage = ({ message, clientMessageId }: MessageEventPayload) => {
      if (message.conversationId !== conversationId) return;
      setTyping(false);
      if (clientMessageId) {
        outboxRef.current.delete(clientMessageId);
        setPendingMessageIds((prev) => {
          if (!prev.has(clientMessageId)) return prev;
          const next = new Set(prev);
          next.delete(clientMessageId);
          return next;
        });
      }
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

    const handleAdminStatus = (payload: AdminStatusPayload) => {
      setAdminStatus(payload.status);
    };

    const handleAdminJoined = (payload: AdminJoinedPayload) => {
      if (payload.conversationId !== conversationId) return;
      setAdminJoined(true);
    };

    const handleMessageDeleted = (payload: MessageDeletedPayload) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId ? { ...m, deleted: true, content: "" } : m))
      );
    };

    const handleConversationStatus = (payload: ConversationStatusPayload) => {
      if (payload.conversationId !== conversationId) return;
      setConversationStatus(payload.status);
    };

    socket.on(SOCKET_EVENTS.MESSAGE, handleMessage);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);
    socket.on(SOCKET_EVENTS.ADMIN_STATUS, handleAdminStatus);
    socket.on(SOCKET_EVENTS.ADMIN_JOINED, handleAdminJoined);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.CONVERSATION_STATUS, handleConversationStatus);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE, handleMessage);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
      socket.off(SOCKET_EVENTS.ADMIN_STATUS, handleAdminStatus);
      socket.off(SOCKET_EVENTS.ADMIN_JOINED, handleAdminJoined);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.CONVERSATION_STATUS, handleConversationStatus);
    };
  }, [socketRef, conversationId]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !conversationId || conversationStatus === "closed") return;

      const optimistic: ChatMessage = {
        id: generateId(),
        conversationId,
        sender: "visitor",
        content: trimmed,
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      outboxRef.current.set(optimistic.id, { conversationId, content: trimmed });
      setPendingMessageIds((prev) => new Set(prev).add(optimistic.id));

      // Sending clears any pending "stop typing" debounce and tells the
      // admin immediately, rather than waiting out the timeout — matches
      // "disappear when the message is sent" in the brief.
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      const socket = socketRef.current;
      if (!socket?.connected) return;
      socket.emit(SOCKET_EVENTS.MESSAGE, {
        conversationId,
        content: trimmed,
        clientMessageId: optimistic.id,
      });
      socket.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
    },
    [socketRef, conversationId, conversationStatus]
  );

  // Debounced chat:typing/chat:stop-typing for the candidate's own typing —
  // mirrors hooks/use-typing.ts's admin-side behaviour (used here directly,
  // rather than sharing that hook, since this side's incoming "admin is
  // typing" state is already handled above by the MESSAGE-adjacent
  // useEffect's own `typing` state).
  const notifyTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;

    socket.emit(SOCKET_EVENTS.TYPING, { conversationId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
    }, TYPING_DEBOUNCE_MS);
  }, [socketRef, conversationId]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    },
    []
  );

  const endChat = useCallback(() => {
    if (!conversationId) return;
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit(SOCKET_EVENTS.SET_STATUS, { conversationId, status: "closed" });
  }, [socketRef, conversationId]);

  return {
    connectionState,
    adminStatus,
    adminJoined,
    conversationStatus,
    pendingMessageIds,
    messages,
    typing,
    sendMessage,
    notifyTyping,
    endChat,
    ready,
    conversationId,
    hasIdentity,
    registering,
    registrationError,
    registerCandidate,
  };
}
