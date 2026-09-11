/**
 * Standalone Socket.IO server for the site's live chat widget.
 *
 * Runs as its own process (see the `socket:dev` script) rather than inside
 * Next.js — the app's serverless API routes can't hold a persistent
 * WebSocket connection open, so the client connects here directly via
 * NEXT_PUBLIC_SOCKET_URL. Reuses the same intent-matching responses that
 * power the site's knowledge (@/lib/portfolioAssistant) so both stay in sync.
 */
import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import eiows from "eiows";
import { matchIntent } from "../src/lib/portfolioAssistant/match";
import { getResponseForIntent } from "../src/lib/portfolioAssistant/responses";
import { isRateLimited } from "../src/lib/portfolioChatRateLimit";
import { verifyLiveChatToken } from "../src/lib/liveChatAuth";

const PORT = Number(process.env.SOCKET_PORT ?? 4001);
const CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN ?? "http://localhost:3000";
const SOCKET_SECRET = process.env.SOCKET_SECRET;
const MAX_MESSAGE_LENGTH = 2_000;

if (!SOCKET_SECRET) {
  throw new Error("SOCKET_SECRET must be set before starting the live chat server.");
}

type SendMessagePayload = {
  id?: unknown;
  message?: unknown;
  senderId?: unknown;
};

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

// Requires a short-lived token (minted server-side by POST /api/live-chat/token)
// rather than the client authenticating with SOCKET_SECRET directly, so the
// secret itself never ships to the browser.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string") {
    next(new Error("Unauthorized"));
    return;
  }

  const verified = verifyLiveChatToken(token, SOCKET_SECRET);
  if (!verified) {
    next(new Error("Unauthorized"));
    return;
  }

  socket.data.visitorId = verified.visitorId;
  next();
});

function clientIp(socket: Socket): string {
  return socket.handshake.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    socket.handshake.address ||
    "unknown";
}

io.on("connection", (socket) => {
  socket.emit("user-online");

  socket.on("send-message", async (payload: SendMessagePayload) => {
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";
    const senderId = typeof payload?.senderId === "string" ? payload.senderId : socket.id;
    const clientMessageId = typeof payload?.id === "string" ? payload.id : undefined;

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    const rateLimitKey = (socket.data.visitorId as string | undefined) ?? clientIp(socket);
    if (isRateLimited(rateLimitKey)) {
      socket.emit("receive-message", {
        id: crypto.randomUUID(),
        message: "You're sending messages too quickly. Please wait a moment and try again.",
        senderId: "assistant",
        timestamp: Date.now(),
      });
      return;
    }

    void senderId;
    void clientMessageId;

    socket.emit("typing", true);

    const intentId = matchIntent(message);
    const response = getResponseForIntent(intentId);

    // Small, human-feeling delay before the reply lands.
    const typingDelay = 500 + Math.random() * 500;
    await new Promise((resolve) => setTimeout(resolve, typingDelay));

    socket.emit("typing", false);
    socket.emit("receive-message", {
      id: crypto.randomUUID(),
      message: response.content,
      senderId: "assistant",
      timestamp: Date.now(),
      actions: response.actions,
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Live chat socket server listening on http://localhost:${PORT}`);
});
