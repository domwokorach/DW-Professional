"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ConnectionState,
  LiveChatMessage,
  ReceiveMessagePayload,
  SendMessagePayload,
} from "./types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
const VISITOR_ID_KEY = "live-chat-visitor-id";
const MESSAGES_STORAGE_KEY = "live-chat-messages";

const WELCOME_MESSAGE: LiveChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi 👋 I'm Dominic's live assistant. Ask me about his experience, projects, skills or availability.",
  timestamp: Date.now(),
};

function getVisitorId(): string {
  if (typeof window === "undefined") return "visitor";
  let id = window.sessionStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

function loadStoredMessages(): LiveChatMessage[] {
  if (typeof window === "undefined") return [WELCOME_MESSAGE];
  try {
    const raw = window.sessionStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw) as LiveChatMessage[];
    return Array.isArray(parsed) && parsed.length ? parsed : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

/**
 * Owns the Socket.IO connection for the lifetime of the app so the launcher's
 * status dot and any unread messages stay accurate even while the panel is
 * closed or minimised, and so a reconnect never drops history.
 */
export function useLiveChatSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [messages, setMessages] = useState<LiveChatMessage[]>(loadStoredMessages);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    window.sessionStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages.slice(-100)));
  }, [messages]);

  useEffect(() => {
    if (!SOCKET_URL) {
      // No live server configured for this environment.
      setConnectionState("offline");
      return;
    }

    let socket: Socket | null = null;
    let cancelled = false;
    setConnectionState("connecting");

    const handleConnect = () => setConnectionState("online");
    const handleDisconnect = () => setConnectionState("reconnecting");
    const handleConnectError = () => setConnectionState("reconnecting");
    const handleReconnectFailed = () => setConnectionState("offline");
    const handleUserOnline = () => setConnectionState("online");
    const handleTyping = (isTyping: boolean) => setTyping(Boolean(isTyping));
    const handleReceiveMessage = (data: ReceiveMessagePayload) => {
      setTyping(false);
      setMessages((prev) => {
        if (prev.some((message) => message.id === data.id)) return prev;
        return [
          ...prev,
          {
            id: data.id,
            role: "assistant",
            content: data.message,
            timestamp: data.timestamp,
            actions: data.actions,
          },
        ];
      });
    };

    async function fetchToken(): Promise<string> {
      const response = await fetch("/api/live-chat/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getVisitorId() }),
      });
      if (!response.ok) throw new Error("Unable to fetch live chat token");
      const { token } = await response.json();
      return token;
    }

    async function connect() {
      try {
        await fetchToken();
      } catch {
        if (!cancelled) setConnectionState("offline");
        return;
      }

      if (cancelled) return;

      // A function (rather than a static object) is refetched by the client
      // on every (re)connect attempt, so a token that expired mid-session
      // gets replaced instead of failing auth on reconnect.
      socket = io(SOCKET_URL, {
        // Let engine.io do its normal polling-handshake-then-upgrade sequence
        // rather than forcing "websocket" as the very first transport: against
        // the server's eiows-backed ws engine, a websocket-only client fails
        // the initial handshake outright. It still ends up upgraded to a real
        // WebSocket connection immediately after connecting.
        transports: ["polling", "websocket"],
        auth: (callback) => {
          fetchToken()
            .then((token) => callback({ token }))
            .catch(() => callback({ token: "" }));
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      socketRef.current = socket;

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.on("user-online", handleUserOnline);
      socket.on("typing", handleTyping);
      socket.on("receive-message", handleReceiveMessage);
      socket.io.on("reconnect_attempt", handleDisconnect);
      socket.io.on("reconnect_failed", handleReconnectFailed);
    }

    connect();

    return () => {
      cancelled = true;
      if (!socket) return;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("user-online", handleUserOnline);
      socket.off("typing", handleTyping);
      socket.off("receive-message", handleReceiveMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: LiveChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    const payload: SendMessagePayload = {
      id: userMessage.id,
      message: trimmed,
      senderId: getVisitorId(),
    };
    socket.emit("send-message", payload);
  }, []);

  return { connectionState, messages, typing, sendMessage };
}
