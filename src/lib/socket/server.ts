import type { Server, Socket } from "socket.io";
import { verifyLiveChatToken } from "@/lib/liveChatAuth";
import { sanitizeMessage } from "@/lib/utils/sanitize-message";
import { isRateLimited } from "@/lib/utils/rate-limit";
import { sendMessage } from "@/lib/chat/send-message";
import { markAsRead } from "@/lib/chat/mark-as-read";
import { getConversationById } from "@/lib/chat/get-conversations";
import { updatePresence } from "@/lib/chat/update-presence";
import { sendNewConversationEmail } from "@/lib/notifications/email";
import { matchIntent } from "@/lib/portfolioAssistant/match";
import { getResponseForIntent } from "@/lib/portfolioAssistant/responses";
import { SOCKET_EVENTS } from "./events";
import { ADMIN_ROOM, getConversationRoom } from "./rooms";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "./types";

type ChatServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/**
 * Wires every chat:* handler onto an already-constructed Socket.IO server.
 * Kept separate from server/socket-server.ts so the transport setup
 * (http server, eiows, cors) stays independent of the chat protocol.
 */
export function attachChatHandlers(io: ChatServer): void {
  const secret = process.env.SOCKET_SECRET;
  if (!secret) {
    throw new Error("SOCKET_SECRET must be set before starting the live chat server.");
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string") return next(new Error("Unauthorized"));

    const claims = verifyLiveChatToken(token, secret);
    if (!claims) return next(new Error("Unauthorized"));

    if (claims.role === "visitor") {
      socket.data.role = "visitor";
      socket.data.visitorId = claims.visitorId;
      socket.data.conversationId = claims.conversationId;
    } else {
      socket.data.role = "admin";
      socket.data.adminId = claims.adminId;
    }
    next();
  });

  io.on("connection", (socket: ChatSocket) => {
    void handleConnection(io, socket);
  });
}

async function handleConnection(io: ChatServer, socket: ChatSocket) {
  if (socket.data.role === "admin" && socket.data.adminId) {
    socket.join(ADMIN_ROOM);
    await updatePresence.markOnline(socket.data.adminId);
    io.emit(SOCKET_EVENTS.ONLINE);
  } else if (socket.data.role === "visitor" && socket.data.conversationId) {
    socket.join(getConversationRoom(socket.data.conversationId));
    const anyAdminOnline = await updatePresence.isAnyAdminOnline();
    if (anyAdminOnline) socket.emit(SOCKET_EVENTS.ONLINE);
  }

  socket.on(SOCKET_EVENTS.JOIN, ({ conversationId }) => {
    if (!conversationId) return;
    // Admins may follow any conversation; visitors are pinned to their own token-bound one.
    if (socket.data.role === "visitor" && conversationId !== socket.data.conversationId) return;
    socket.join(getConversationRoom(conversationId));
  });

  socket.on(SOCKET_EVENTS.MESSAGE, async ({ conversationId, content, clientMessageId }) => {
    if (socket.data.role !== "visitor" || conversationId !== socket.data.conversationId) return;
    await handleIncomingMessage(io, socket, conversationId, content, clientMessageId);
  });

  socket.on(SOCKET_EVENTS.REPLY, async ({ conversationId, content }) => {
    if (socket.data.role !== "admin" || !socket.data.adminId) return;
    await handleAdminReply(io, conversationId, content, socket.data.adminId);
  });

  socket.on(SOCKET_EVENTS.TYPING, ({ conversationId }) => {
    broadcastTyping(io, socket, conversationId, true);
  });

  socket.on(SOCKET_EVENTS.STOP_TYPING, ({ conversationId }) => {
    broadcastTyping(io, socket, conversationId, false);
  });

  socket.on(SOCKET_EVENTS.READ, async ({ conversationId, reader }) => {
    await markAsRead(conversationId, reader);
    const conversation = await getConversationById(conversationId);
    if (conversation) {
      io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, { conversation });
    }
  });

  socket.on("disconnect", () => {
    void handleDisconnect(io, socket);
  });
}

async function handleIncomingMessage(
  io: ChatServer,
  socket: ChatSocket,
  conversationId: string,
  rawContent: string,
  clientMessageId?: string
) {
  const content = sanitizeMessage(rawContent);
  if (!content) return;

  const rateLimitKey = socket.data.visitorId ?? socket.id;
  if (isRateLimited(rateLimitKey)) return;

  const message = await sendMessage({
    conversationId,
    sender: "visitor",
    senderId: socket.data.visitorId,
    content,
  });

  const room = getConversationRoom(conversationId);
  io.to(room).emit(SOCKET_EVENTS.MESSAGE, { message, clientMessageId });

  const conversation = await getConversationById(conversationId);
  if (!conversation) return;
  io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.NEW_CONVERSATION, { conversation });

  const anyAdminOnline = await updatePresence.isAnyAdminOnline();
  if (!anyAdminOnline) {
    await sendNewConversationEmail(conversation);
    await sendBotReply(io, conversationId, content);
  }
}

async function handleAdminReply(io: ChatServer, conversationId: string, rawContent: string, adminId: string) {
  const content = sanitizeMessage(rawContent);
  if (!content) return;

  const message = await sendMessage({
    conversationId,
    sender: "admin",
    senderId: adminId,
    content,
  });

  io.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE, { message });

  const conversation = await getConversationById(conversationId);
  if (conversation) {
    io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, { conversation });
  }
}

/** Falls back to the portfolio's canned-response assistant so a visitor never talks to silence while no admin is online. */
async function sendBotReply(io: ChatServer, conversationId: string, visitorMessage: string) {
  const room = getConversationRoom(conversationId);
  io.to(room).emit(SOCKET_EVENTS.TYPING, { conversationId, sender: "admin", isTyping: true });

  const intentId = matchIntent(visitorMessage);
  const response = getResponseForIntent(intentId);
  const typingDelay = 500 + Math.random() * 500;
  await new Promise((resolve) => setTimeout(resolve, typingDelay));

  const message = await sendMessage({
    conversationId,
    sender: "bot",
    content: response.content,
  });

  io.to(room).emit(SOCKET_EVENTS.TYPING, { conversationId, sender: "admin", isTyping: false });
  io.to(room).emit(SOCKET_EVENTS.MESSAGE, { message });
}

function broadcastTyping(io: ChatServer, socket: ChatSocket, conversationId: string, isTyping: boolean) {
  const sender = socket.data.role === "admin" ? "admin" : "visitor";
  socket.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.TYPING, {
    conversationId,
    sender,
    isTyping,
  });
}

async function handleDisconnect(io: ChatServer, socket: ChatSocket) {
  if (socket.data.role !== "admin" || !socket.data.adminId) return;

  await updatePresence.markOffline(socket.data.adminId);
  const stillOnline = await updatePresence.isAnyAdminOnline();
  if (!stillOnline) io.emit(SOCKET_EVENTS.OFFLINE);
}
