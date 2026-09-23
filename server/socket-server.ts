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
import { verifyRelay } from "../src/lib/socket/relay";
import { attachChatHandlers, relayChatEvent } from "../src/lib/socket/server";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "../src/lib/socket/types";

process.on("uncaughtException", (error) => {
  console.error("[socket] uncaughtException", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[socket] unhandledRejection", reason);
});

// Hosts like Render/Railway/Fly inject PORT and require the process to bind
// to it — that must win whenever it's present. SOCKET_PORT is the local-dev
// override for when nothing injects PORT. No automatic fallback to a
// different port if the resolved one is busy: clients (the Next.js app,
// NEXT_PUBLIC_SOCKET_URL) are configured against a specific port, so silently
// picking another one would just move the failure to "can't connect" instead
// of the clearer "port in use" error below.
let PORT: number;
let portSource: "PORT" | "SOCKET_PORT" | "default";
if (process.env.PORT) {
  PORT = Number(process.env.PORT);
  portSource = "PORT";
} else if (process.env.SOCKET_PORT) {
  PORT = Number(process.env.SOCKET_PORT);
  portSource = "SOCKET_PORT";
} else {
  PORT = 3001;
  portSource = "default";
}

console.log("[socket] startup", {
  nodeEnv: process.env.NODE_ENV,
  port: PORT,
  portSource,
  socketSecretConfigured: Boolean(process.env.SOCKET_SECRET),
  databaseConfigured: Boolean(process.env.DATABASE_URL),
  redisConfigured: Boolean(process.env.REDIS_URL),
  corsOrigin: process.env.SOCKET_CORS_ORIGIN,
});

// SOCKET_CORS_ORIGIN may be a single origin or a comma-separated list (e.g.
// both the apex and www production domains). Localhost is only allowed
// outside production, even if it is accidentally included in the environment.
const allowedOrigins = [
  "https://www.dominicwokorach.me",
  "https://dominicwokorach.me",
  ...(process.env.SOCKET_CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => {
      if (!origin || origin === "*") return false;
      if (process.env.NODE_ENV !== "production") return true;
      try {
        const url = new URL(origin);
        return url.protocol === "https:" &&
          !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      } catch {
        return false;
      }
    }),
];

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:3000");
}

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
  if (req.url === "/internal/chat/events" && req.method === "POST") {
    void (async () => {
      let body = "";
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 8192) { res.writeHead(413).end(); return; }
      }
      if (!verifyRelay(body, String(req.headers["x-chat-timestamp"] ?? ""), String(req.headers["x-chat-signature"] ?? ""), process.env.SOCKET_SECRET ?? "")) {
        res.writeHead(401).end(); return;
      }
      const event = JSON.parse(body) as { channel: string; payload: unknown };
      const accepted = await relayChatEvent(io, event.channel, event.payload);
      res.writeHead(accepted ? 204 : 400).end();
    })().catch((error) => {
      console.error("[socket] event relay failed", error);
      if (!res.headersSent) res.writeHead(500).end();
    });
    return;
  }
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

httpServer.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `[socket] Port ${PORT} is already in use. Stop the existing socket server or configure a different port.`
    );
  } else {
    console.error("[socket] http server error", error);
  }
  process.exit(1);
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[socket] listening on 0.0.0.0:${PORT}`);
});

// Local dev restarts (tsx watch, manual re-runs) are the main source of
// stale listeners holding the port; closing cleanly on SIGINT/SIGTERM makes
// that far less likely without masking a real EADDRINUSE with a fallback.
function shutdown(signal: NodeJS.Signals) {
  console.log(`[socket] received ${signal}, shutting down`);
  io.close(() => {
    httpServer.close(() => {
      console.log("[socket] shutdown complete");
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
