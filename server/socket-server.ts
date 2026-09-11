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

const PORT = Number(process.env.SOCKET_PORT ?? 4001);
const CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN ?? "http://localhost:3000";

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Live chat socket server is running.\n");
});

const io = new Server(httpServer, {
  wsEngine: eiows.Server,
  perMessageDeflate: false,
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

attachChatHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Live chat socket server listening on http://localhost:${PORT}`);
});
