import type { Server, Socket } from "socket.io";
import { verifyLiveChatToken } from "@/lib/liveChatAuth";
import { sanitizeMessage } from "@/lib/utils/sanitize-message";
import { isRateLimited } from "@/lib/utils/rate-limit";
import { sendMessage, markMessageDelivered } from "@/lib/chat/send-message";
import { markAsRead } from "@/lib/chat/mark-as-read";
import { getConversationById } from "@/lib/chat/get-conversations";
import { assignConversationAdminIfUnset } from "@/lib/chat/update-conversation";
import { updatePresence } from "@/lib/chat/update-presence";
import { sendNewConversationEmail } from "@/lib/notifications/email";
import { matchIntent } from "@/lib/portfolioAssistant/match";
import { getResponseForIntent } from "@/lib/portfolioAssistant/responses";
import {
  adminMessageSchema,
  adminOpenPayloadSchema,
  candidateMessageSchema,
  joinPayloadSchema,
  readPayloadSchema,
  safeParse,
  typingPayloadSchema,
} from "@/lib/chat/validation";
import { SOCKET_EVENTS } from "./events";
import { ADMIN_ROOM, PRESENCE_ROOM, getConversationRoom } from "./rooms";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "./types";
import type { AdminPresenceState } from "@/types/socket";

type ChatServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

// After this long without activity (mouse/keyboard/opening a conversation/
// replying), an online admin is flipped to "away". Overridable for tests.
const ADMIN_AWAY_AFTER_MS = Number(process.env.ADMIN_AWAY_AFTER_MS) || 5 * 60 * 1000;
const INACTIVITY_SWEEP_INTERVAL_MS = 30_000;

// Safety net: if a "stop typing" is ever lost (client crash, dropped
// packet), the indicator on the other end must not get stuck forever.
const TYPING_AUTO_STOP_MS = 6_000;

/**
 * Wires every chat:* handler onto an already-constructed Socket.IO server.
 * Kept separate from server/socket-server.ts so the transport setup
 * (http server, cors) stays independent of the chat protocol.
 */
export function attachChatHandlers(io: ChatServer): void {
  const secret = process.env.SOCKET_SECRET;
  if (!secret) {
    throw new Error("SOCKET_SECRET must be set before starting the live chat server.");
  }

  const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
    void handleConnection(io, socket, typingTimers);
  });

  const sweep = setInterval(() => {
    void sweepInactiveAdmins(io);
  }, INACTIVITY_SWEEP_INTERVAL_MS);
  sweep.unref();
}

async function broadcastAdminStatus(io: ChatServer, status: AdminPresenceState) {
  const payload = { status, updatedAt: new Date().toISOString() };
  io.to(PRESENCE_ROOM).emit(SOCKET_EVENTS.ADMIN_STATUS, payload);
  io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.ADMIN_STATUS, payload);
}

async function sweepInactiveAdmins(io: ChatServer) {
  const staleIds = await updatePresence.getStaleOnlineAdminIds(ADMIN_AWAY_AFTER_MS);
  if (staleIds.length === 0) return;

  for (const adminId of staleIds) {
    await updatePresence.markAway(adminId);
  }
  const status = await updatePresence.getAggregateStatus();
  await broadcastAdminStatus(io, status);
}

/** Marks the admin active and, if this actually flipped them away→online, broadcasts the new aggregate status. */
async function noteAdminActivity(io: ChatServer, adminId: string) {
  const wasAway = await updatePresence.touchActivity(adminId);
  if (wasAway) {
    const status = await updatePresence.getAggregateStatus();
    await broadcastAdminStatus(io, status);
  }
}

async function handleConnection(
  io: ChatServer,
  socket: ChatSocket,
  typingTimers: Map<string, ReturnType<typeof setTimeout>>
) {
  console.log("[socket] connected", { id: socket.id, role: socket.data.role });

  // Redis presence expires after 60 seconds. Refresh it while this socket is
  // connected so an active admin does not disappear and trigger bot replies.
  const presenceHeartbeat = setInterval(() => {
    const refresh = socket.data.role === "admin" && socket.data.adminId
      ? updatePresence.refreshTtl(socket.data.adminId)
      : socket.data.visitorId
        ? updatePresence.markVisitorOnline(socket.data.visitorId)
        : Promise.resolve();
    void refresh.catch((error) => console.error("[socket] presence refresh failed", error));
  }, 20_000);
  presenceHeartbeat.unref();
  socket.once("disconnect", () => clearInterval(presenceHeartbeat));

  if (socket.data.role === "admin" && socket.data.adminId) {
    socket.join(ADMIN_ROOM);
    await updatePresence.markOnline(socket.data.adminId);
    await broadcastAdminStatus(io, await updatePresence.getAggregateStatus());
  } else if (socket.data.role === "visitor" && socket.data.conversationId && socket.data.visitorId) {
    socket.join(getConversationRoom(socket.data.conversationId));
    socket.join(PRESENCE_ROOM);

    const status = await updatePresence.getAggregateStatus();
    socket.emit(SOCKET_EVENTS.ADMIN_STATUS, { status, updatedAt: new Date().toISOString() });

    await updatePresence.markVisitorOnline(socket.data.visitorId);
    io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.PRESENCE, { userId: socket.data.visitorId, online: true });
  }

  socket.on(SOCKET_EVENTS.JOIN, (payload) => {
    const parsed = safeParse(joinPayloadSchema, payload);
    if (!parsed) return;
    const { conversationId } = parsed;
    // Admins may follow any conversation; visitors are pinned to their own token-bound one.
    if (socket.data.role === "visitor" && conversationId !== socket.data.conversationId) return;
    socket.join(getConversationRoom(conversationId));
  });

  socket.on(SOCKET_EVENTS.ADMIN_OPEN, (payload) => {
    const parsed = safeParse(adminOpenPayloadSchema, payload);
    if (!parsed || socket.data.role !== "admin" || !socket.data.adminId) return;
    void handleAdminOpen(io, parsed.conversationId, socket.data.adminId);
  });

  socket.on(SOCKET_EVENTS.ADMIN_ACTIVITY, () => {
    if (socket.data.role !== "admin" || !socket.data.adminId) return;
    void noteAdminActivity(io, socket.data.adminId);
  });

  socket.on(SOCKET_EVENTS.MESSAGE, async (payload) => {
    const parsed = safeParse(candidateMessageSchema, payload);
    if (!parsed) return;
    if (socket.data.role !== "visitor" || parsed.conversationId !== socket.data.conversationId) return;
    await handleIncomingMessage(io, socket, parsed.conversationId, parsed.content, parsed.clientMessageId);
  });

  socket.on(SOCKET_EVENTS.REPLY, async (payload) => {
    const parsed = safeParse(adminMessageSchema, payload);
    if (!parsed) return;
    if (socket.data.role !== "admin" || !socket.data.adminId) return;
    await handleAdminReply(io, parsed.conversationId, parsed.content, socket.data.adminId, parsed.clientMessageId);
  });

  socket.on(SOCKET_EVENTS.TYPING, (payload) => {
    const parsed = safeParse(typingPayloadSchema, payload);
    if (!parsed) return;
    broadcastTyping(io, socket, parsed.conversationId, true, typingTimers);
  });

  socket.on(SOCKET_EVENTS.STOP_TYPING, (payload) => {
    const parsed = safeParse(typingPayloadSchema, payload);
    if (!parsed) return;
    clearTypingTimer(typingTimers, parsed.conversationId, socket.data.role);
    broadcastTyping(io, socket, parsed.conversationId, false, typingTimers, true);
  });

  socket.on(SOCKET_EVENTS.READ, async (payload) => {
    const parsed = safeParse(readPayloadSchema, payload);
    if (!parsed) return;
    await markAsRead(parsed.conversationId, parsed.reader);
    const conversation = await getConversationById(parsed.conversationId);
    if (conversation) {
      io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, { conversation });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected", { id: socket.id, reason });
    void handleDisconnect(io, socket);
  });
}

async function handleAdminOpen(io: ChatServer, conversationId: string, adminId: string) {
  await noteAdminActivity(io, adminId);
  const assigned = await assignConversationAdminIfUnset(conversationId, adminId);
  if (!assigned) return;

  io.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.ADMIN_JOINED, {
    conversationId,
    adminId,
  });
  io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, { conversation: assigned });
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
    clientMessageId,
  });

  const room = getConversationRoom(conversationId);
  const aggregateStatus = await updatePresence.getAggregateStatus();
  const isDelivered = aggregateStatus !== "offline" && message.status === "sent";
  if (isDelivered) await markMessageDelivered(message.id);
  const outgoing = isDelivered ? { ...message, status: "delivered" as const } : message;

  io.to(room).emit(SOCKET_EVENTS.MESSAGE, { message: outgoing, clientMessageId });

  const conversation = await getConversationById(conversationId);
  if (!conversation) return;
  io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.NEW_CONVERSATION, { conversation });

  if (aggregateStatus === "offline") {
    await sendNewConversationEmail(conversation);
    await sendBotReply(io, conversationId, content);
  }
}

async function handleAdminReply(
  io: ChatServer,
  conversationId: string,
  rawContent: string,
  adminId: string,
  clientMessageId?: string
) {
  const content = sanitizeMessage(rawContent);
  if (!content) return;

  await noteAdminActivity(io, adminId);

  const message = await sendMessage({
    conversationId,
    sender: "admin",
    senderId: adminId,
    content,
    clientMessageId,
  });

  io.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE, { message, clientMessageId });

  // Replying without ever having explicitly "opened" the conversation
  // (older client, or a reply sent straight from a notification) still
  // counts as the admin having joined it.
  const assigned = await assignConversationAdminIfUnset(conversationId, adminId);
  if (assigned) {
    io.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.ADMIN_JOINED, { conversationId, adminId });
  }

  const conversation = assigned ?? (await getConversationById(conversationId));
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

function typingTimerKey(conversationId: string, sender: "visitor" | "admin"): string {
  return `${conversationId}:${sender}`;
}

function clearTypingTimer(
  typingTimers: Map<string, ReturnType<typeof setTimeout>>,
  conversationId: string,
  role: "visitor" | "admin" | undefined
) {
  if (!role) return;
  const key = typingTimerKey(conversationId, role);
  const timer = typingTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    typingTimers.delete(key);
  }
}

function broadcastTyping(
  io: ChatServer,
  socket: ChatSocket,
  conversationId: string,
  isTyping: boolean,
  typingTimers: Map<string, ReturnType<typeof setTimeout>>,
  skipAutoStopTimer = false
) {
  const sender = socket.data.role === "admin" ? "admin" : "visitor";
  socket.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.TYPING, {
    conversationId,
    sender,
    isTyping,
  });

  if (skipAutoStopTimer) return;

  const key = typingTimerKey(conversationId, sender);
  const existing = typingTimers.get(key);
  if (existing) clearTimeout(existing);

  if (isTyping) {
    const timer = setTimeout(() => {
      typingTimers.delete(key);
      socket.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.TYPING, {
        conversationId,
        sender,
        isTyping: false,
      });
    }, TYPING_AUTO_STOP_MS);
    timer.unref();
    typingTimers.set(key, timer);
  } else {
    typingTimers.delete(key);
  }
}

async function handleDisconnect(io: ChatServer, socket: ChatSocket) {
  if (socket.data.role === "admin" && socket.data.adminId) {
    await updatePresence.markOffline(socket.data.adminId);
    const status = await updatePresence.getAggregateStatus();
    await broadcastAdminStatus(io, status);
    return;
  }

  if (socket.data.role === "visitor" && socket.data.visitorId) {
    await updatePresence.markVisitorOffline(socket.data.visitorId);
    io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.PRESENCE, { userId: socket.data.visitorId, online: false });
  }
}
