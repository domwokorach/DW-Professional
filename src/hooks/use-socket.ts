"use client";

import { useEffect, useRef, useState } from "react";
import { createSocket, type ChatSocket } from "@/lib/socket/client";
import type { ConnectionState } from "@/types/chat";

/**
 * Owns connect/disconnect/reconnect for a single Socket.IO connection.
 * `fetchToken` is called on every (re)connect attempt so a token that
 * expired mid-session gets replaced instead of failing auth on reconnect.
 */
export function useSocket(fetchToken: () => Promise<string>, enabled = true) {
  const socketRef = useRef<ChatSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    if (!enabled) return;
    if (!process.env.NEXT_PUBLIC_SOCKET_URL) {
      setConnectionState("offline");
      return;
    }

    const socket = createSocket(fetchToken);
    socketRef.current = socket;
    setConnectionState("connecting");

    const handleConnect = () => setConnectionState("online");
    const handleDisconnect = () => setConnectionState("reconnecting");
    const handleConnectError = () => setConnectionState("reconnecting");
    const handleReconnectFailed = () => setConnectionState("offline");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.io.on("reconnect_attempt", handleDisconnect);
    socket.io.on("reconnect_failed", handleReconnectFailed);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.io.off("reconnect_attempt", handleDisconnect);
      socket.io.off("reconnect_failed", handleReconnectFailed);
      socket.disconnect();
      socketRef.current = null;
    };
    // fetchToken is intentionally excluded: a new function identity per
    // render must not tear down and reconnect the socket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { socketRef, connectionState };
}
