"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSocket, type ChatSocket } from "@/lib/socket/client";
import { ChatUnavailableError, SessionExpiredError } from "@/lib/socket/errors";
import type { ConnectionState } from "@/types/chat";

// socket.io-client's own reconnectionAttempts is kept at Infinity (see
// lib/socket/client.ts) so a genuinely temporary outage recovers on its own.
// But that means socket.io's "reconnect_failed" never fires on its own, so
// without a client-side ceiling the UI would show "Reconnecting…" forever
// even when the backend is permanently unreachable. After this many
// consecutive failed attempts we relabel the state "offline" while socket.io
// keeps retrying underneath, so it still recovers silently the moment the
// backend comes back.
const OFFLINE_AFTER_ATTEMPTS = 5;

/**
 * Owns connect/disconnect/reconnect for a single Socket.IO connection.
 * `fetchToken` is called on every (re)connect attempt so a token that
 * expired mid-session gets replaced instead of failing auth on reconnect —
 * unless the fetcher throws SessionExpiredError, which means the caller is
 * no longer authorized at all (not just a stale token), in which case
 * reconnection is abandoned and "unauthorized" is reported instead of
 * retrying forever against a request that can never succeed.
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

    const failureRef: { current: "session-expired" | "auth-failed" | null } = { current: null };
    const wrappedFetchToken = async () => {
      try {
        const token = await fetchToken();
        failureRef.current = null;
        return token;
      } catch (error) {
        if (error instanceof SessionExpiredError) failureRef.current = "session-expired";
        else if (error instanceof ChatUnavailableError) failureRef.current = "auth-failed";
        else failureRef.current = null;
        throw error;
      }
    };

    const socket = createSocket(wrappedFetchToken);
    socketRef.current = socket;
    setConnectionState("connecting");
    let reconnectAttempts = 0;

    const handleConnect = () => {
      reconnectAttempts = 0;
      console.log("[chat] connected", socket.id);
      setConnectionState("online");
    };
    const handleDisconnect = (reason: string) => {
      console.log("[chat] disconnected", reason);
      setConnectionState("reconnecting");
    };
    const handleConnectError = (error: Error) => {
      console.error("[chat] connect_error", {
        message: error.message,
        description: (error as { description?: unknown }).description,
        context: (error as { context?: unknown }).context,
      });

      // "Unauthorized" is the socket server's own middleware rejecting the
      // token (bad signature, mismatched SOCKET_SECRET between the Next.js
      // app and the socket server, malformed claims) — a permanent failure
      // for this session, not a transient network blip. Retrying forever
      // against it just relabels a broken config as "Reconnecting…" forever,
      // which is indistinguishable from a real transient outage. Treat it
      // the same as a client-side SessionExpiredError: stop and surface it.
      if (failureRef.current === "session-expired" || error.message === "Unauthorized") {
        setConnectionState("unauthorized");
        socket.disconnect();
        return;
      }
      // A request that can never succeed (bad payload, live chat not
      // configured server-side) — same idea, different terminal state.
      if (failureRef.current === "auth-failed") {
        setConnectionState("auth-failed");
        socket.disconnect();
        return;
      }
      setConnectionState(reconnectAttempts >= OFFLINE_AFTER_ATTEMPTS ? "offline" : "reconnecting");
    };
    const handleReconnectFailed = () => setConnectionState("offline");
    const handleReconnectAttempt = (attempt: number) => {
      reconnectAttempts = attempt;
      console.log("[chat] reconnect attempt", attempt);
      setConnectionState(attempt > OFFLINE_AFTER_ATTEMPTS ? "offline" : "reconnecting");
    };
    const handleReconnect = (attempt: number) => console.log("[chat] reconnected", attempt);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect_failed", handleReconnectFailed);
    socket.io.on("reconnect", handleReconnect);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect_failed", handleReconnectFailed);
      socket.io.off("reconnect", handleReconnect);
      socket.disconnect();
      socketRef.current = null;
    };
    // fetchToken is intentionally excluded: a new function identity per
    // render must not tear down and reconnect the socket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const reconnect = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.connected) return;
    setConnectionState("connecting");
    socket.connect();
  }, []);

  return { socketRef, connectionState, reconnect };
}
