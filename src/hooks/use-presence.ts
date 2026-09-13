"use client";

import { useEffect, useState } from "react";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import type { ChatSocket } from "@/lib/socket/client";
import type { AdminStatusPayload } from "@/types/socket";

/** Tracks whether at least one admin is online (or away), driven by the server's admin:status broadcast. */
export function usePresence(socketRef: React.RefObject<ChatSocket | null>) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleStatus = (payload: AdminStatusPayload) => setOnline(payload.status !== "offline");

    socket.on(SOCKET_EVENTS.ADMIN_STATUS, handleStatus);
    return () => {
      socket.off(SOCKET_EVENTS.ADMIN_STATUS, handleStatus);
    };
  }, [socketRef]);

  return online;
}
