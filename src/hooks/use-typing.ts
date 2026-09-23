"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { TYPING_DEBOUNCE_MS } from "@/lib/chat/constants";
import type { ChatSocket } from "@/lib/socket/client";
import type { TypingEventPayload } from "@/types/socket";

/** Emits chat:typing/chat:stop-typing (debounced) and reports the other side's typing state. */
export function useTyping(
  socketRef: React.RefObject<ChatSocket | null>,
  conversationId: string | null,
  watchSender: "visitor" | "admin"
) {
  const [remoteTyping, setRemoteTyping] = useState(false);
  const lastEmitRef = useRef(0);
  const remoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (payload: TypingEventPayload) => {
      if (payload.conversationId !== conversationId || payload.sender !== watchSender) return;
      setRemoteTyping(payload.isTyping);
      if (remoteTimeoutRef.current) clearTimeout(remoteTimeoutRef.current);
      if (payload.isTyping) remoteTimeoutRef.current = setTimeout(() => setRemoteTyping(false), 6000);
    };

    socket.on(SOCKET_EVENTS.TYPING, handler);
    return () => {
      socket.off(SOCKET_EVENTS.TYPING, handler);
      if (remoteTimeoutRef.current) clearTimeout(remoteTimeoutRef.current);
      setRemoteTyping(false);
    };
  }, [socketRef, conversationId, watchSender]);

  const notifyTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !conversationId) return;

    if (Date.now() - lastEmitRef.current > 1000) {
      socket.volatile.emit(SOCKET_EVENTS.TYPING, { conversationId });
      lastEmitRef.current = Date.now();
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
    }, TYPING_DEBOUNCE_MS);
  }, [socketRef, conversationId]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { remoteTyping, notifyTyping };
}
