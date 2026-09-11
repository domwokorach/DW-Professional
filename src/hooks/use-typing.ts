"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import { TYPING_DEBOUNCE_MS } from "@/config/chat";
import type { ChatSocket } from "@/lib/socket/client";
import type { TypingEventPayload } from "@/types/socket";

/** Emits chat:typing/chat:stop-typing (debounced) and reports the other side's typing state. */
export function useTyping(
  socketRef: React.RefObject<ChatSocket | null>,
  conversationId: string | null,
  watchSender: "visitor" | "admin"
) {
  const [remoteTyping, setRemoteTyping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (payload: TypingEventPayload) => {
      if (payload.conversationId !== conversationId || payload.sender !== watchSender) return;
      setRemoteTyping(payload.isTyping);
    };

    socket.on(SOCKET_EVENTS.TYPING, handler);
    return () => {
      socket.off(SOCKET_EVENTS.TYPING, handler);
    };
  }, [socketRef, conversationId, watchSender]);

  const notifyTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;

    socket.emit(SOCKET_EVENTS.TYPING, { conversationId });
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
