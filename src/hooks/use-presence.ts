"use client";

import { useEffect, useState } from "react";
import { SOCKET_EVENTS } from "@/lib/socket/events";
import type { ChatSocket } from "@/lib/socket/client";

/** Tracks whether at least one admin is online, driven by the server's chat:online/chat:offline broadcast. */
export function usePresence(socketRef: React.RefObject<ChatSocket | null>) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    socket.on(SOCKET_EVENTS.ONLINE, handleOnline);
    socket.on(SOCKET_EVENTS.OFFLINE, handleOffline);
    return () => {
      socket.off(SOCKET_EVENTS.ONLINE, handleOnline);
      socket.off(SOCKET_EVENTS.OFFLINE, handleOffline);
    };
  }, [socketRef]);

  return online;
}
