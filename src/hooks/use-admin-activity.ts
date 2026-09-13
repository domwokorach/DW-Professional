"use client";

import { useEffect, useRef } from "react";
import type { ChatSocket } from "@/lib/socket/client";
import { SOCKET_EVENTS } from "@/lib/socket/events";

const ACTIVITY_THROTTLE_MS = 20_000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll"] as const;

/**
 * Reports the admin as "active" (mouse/keyboard/tab focus) so the socket
 * server's inactivity sweep doesn't flip them to "away" while they're
 * genuinely using the dashboard. Throttled so this is a handful of tiny
 * pings, not an emit per pixel of mouse movement.
 */
export function useAdminActivity(socketRef: React.RefObject<ChatSocket | null>) {
  const lastSentRef = useRef(0);

  useEffect(() => {
    const notify = () => {
      const socket = socketRef.current;
      if (!socket?.connected) return;
      const now = Date.now();
      if (now - lastSentRef.current < ACTIVITY_THROTTLE_MS) return;
      lastSentRef.current = now;
      socket.emit(SOCKET_EVENTS.ADMIN_ACTIVITY);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") notify();
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, notify, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, notify);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [socketRef]);
}
