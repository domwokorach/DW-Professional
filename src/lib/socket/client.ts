import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Not auto-connected: callers supply a per-connect `auth` token fetcher so a
 * token that expired mid-session gets replaced on reconnect instead of
 * failing auth (see hooks/use-socket.ts).
 */
export function createSocket(fetchToken: () => Promise<string>): ChatSocket {
  return io(SOCKET_URL, {
    autoConnect: false,
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
}
