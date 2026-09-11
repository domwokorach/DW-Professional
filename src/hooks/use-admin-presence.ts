"use client";

import { useEffect, useState } from "react";
import type { ChatSocket } from "@/lib/socket/client";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import type { PresencePayload } from "@/types/socket";

/** Admin-side visitor presence: tracks which visitorIds are currently connected, keyed by conversation.visitorId. */
export function useAdminPresence(socketRef: React.RefObject<ChatSocket | null>) {
  const [onlineVisitorIds, setOnlineVisitorIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handlePresence = ({ userId, online }: PresencePayload) => {
      setOnlineVisitorIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on(SOCKET_EVENTS.PRESENCE, handlePresence);
    return () => {
      socket.off(SOCKET_EVENTS.PRESENCE, handlePresence);
    };
  }, [socketRef]);

  return onlineVisitorIds;
}
