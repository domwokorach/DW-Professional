/**
 * Standalone Socket.IO server for the site's live chat (candidate widget +
 * admin dashboard). Runs as its own process (see the `socket:dev` script)
 * rather than inside Next.js — the app's serverless API routes can't hold a
 * persistent WebSocket connection open, so clients connect here directly
 * via NEXT_PUBLIC_SOCKET_URL. Protocol logic lives in
 * src/lib/socket/server.ts so it stays testable independent of transport
 * setup.
 */
import { createServer } from "node:http";
import { Server } from "socket.io";
import eiows from "eiows";
import { attachChatHandlers } from "../src/lib/socket/server";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "../src/lib/socket/types";

// Hosts like Render/Railway/Fly inject PORT and require the process to bind
// to it — that must win whenever it's present. SOCKET_PORT is the local-dev
// override for when nothing injects PORT.
const PORT = Number(process.env.PORT ?? process.env.SOCKET_PORT ?? 4001);

// SOCKET_CORS_ORIGIN may be a single origin or a comma-separated list (e.g.
// both the apex and www production domains). localhost:3000 is always
// allowed in addition so local dev keeps working regardless of what's
// configured for production.
const allowedOrigins = [
  ...(process.env.SOCKET_CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  "http://localhost:3000",
];

// Fail loudly and immediately on misconfiguration rather than letting every
// connection silently reject as "Unauthorized" — a mismatched or missing
// SOCKET_SECRET between this process and the Next.js app is the single most
// common cause of "chat won't connect", and is otherwise invisible from the
// browser (it just looks like an auth failure with no further detail).
if (!process.env.SOCKET_SECRET) {
  console.error(
    "[socket] SOCKET_SECRET is not set. Set the SAME value in the env file this process " +
      "loads (see the socket:dev/socket:start script) and in the Next.js app's env file — " +
      "a mismatch causes every token to fail verification with 'Unauthorized'."
  );
  process.exit(1);
}

const httpServer = createServer((req, res) => {
  // Lets `curl http://localhost:PORT/health` distinguish "server isn't
  // running" from "server is running but the client can't connect" before
  // debugging further up the stack.
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "socket" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Live chat socket server is running.\n");
});

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
  wsEngine: eiows.Server,
  perMessageDeflate: false,
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      console.error(`[socket] rejected CORS origin: ${origin}`);
      callback(new Error(`Origin ${origin} is not allowed`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

attachChatHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Live chat socket server listening on http://localhost:${PORT}`);
});
