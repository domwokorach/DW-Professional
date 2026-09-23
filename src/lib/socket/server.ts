import type { Server, Socket } from "socket.io";
import { verifyLiveChatToken } from "@/lib/liveChatAuth";
import { sanitizeMessage } from "@/lib/utils/sanitize-message";
import { isRateLimited } from "@/lib/utils/rate-limit";
import { sendMessage, markMessageDelivered, deleteMessage } from "@/lib/chat/send-message";
import { markAsRead } from "@/lib/chat/mark-as-read";
import { getMessageById } from "@/lib/chat/get-messages";
import { getConversationById } from "@/lib/chat/get-conversations";
import { CHAT_MESSAGE_CREATED_CHANNEL, type ChatMessageCreatedEvent } from "@/lib/chat/message-created-channel";
import { assignConversationAdminIfUnset, updateConversation } from "@/lib/chat/update-conversation";
import { updatePresence } from "@/lib/chat/update-presence";
import { subscribe } from "@/lib/redis/pubsub";
import { ADMIN_AVAILABILITY_CHANGED_CHANNEL } from "@/lib/chat/availability-channel";
import { sendWaitingConversationNotifications } from "@/lib/chat/waiting-notifications";
import { matchIntent } from "@/lib/portfolioAssistant/match";
import { getResponseForIntent } from "@/lib/portfolioAssistant/responses";
import {
  adminMessageSchema,
  adminOpenPayloadSchema,
  candidateMessageSchema,
  deleteMessagePayloadSchema,
  joinPayloadSchema,
  readPayloadSchema,
  safeParse,
  setStatusPayloadSchema,
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

// Fine-grained enough that the initial alert goes out within roughly a
// minute of a conversation starting to wait, without hammering the database
// or Resend every few seconds.
const WAITING_NOTIFICATION_SWEEP_INTERVAL_MS = 60_000;

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

  const notificationSweep = setInterval(() => {
    void sendWaitingConversationNotifications().catch((error) =>
      console.error("[socket] waiting-conversation notification sweep failed", error)
    );
  }, WAITING_NOTIFICATION_SWEEP_INTERVAL_MS);
  notificationSweep.unref();

  // A manual availability change made from Admin Settings is written by the
  // Next.js app, a separate process from this socket server. It publishes
  // here instead of calling us directly; re-broadcast the recomputed
  // aggregate status the same way any connect/disconnect/activity change
  // would. No-ops in single-instance dev (REDIS_URL unset) — the settings
  // change still takes effect on next reconnect/poll via getAggregateStatus.
  subscribe(ADMIN_AVAILABILITY_CHANGED_CHANNEL, () => {
    void (async () => {
      const status = await updatePresence.getAggregateStatus();
      await broadcastAdminStatus(io, status);
    })().catch((error) => console.error("[socket] availability broadcast failed", error));
  });

  // A message created by the attachment-completion REST route (Next.js
  // process — see src/app/api/chat/attachments/complete/route.ts) reaches
  // connected clients the same cross-process way as an availability change.
  subscribe(CHAT_MESSAGE_CREATED_CHANNEL, (payload) => {
    void handleExternallyCreatedMessage(io, payload as ChatMessageCreatedEvent).catch((error) =>
      console.error("[socket] externally-created message broadcast failed", error)
    );
  });
}

/** Used by the signed web-app relay when Redis is not available. */
export async function relayChatEvent(io: ChatServer, channel: string, payload: unknown): Promise<boolean> {
  if (channel === ADMIN_AVAILABILITY_CHANGED_CHANNEL) {
    await broadcastAdminStatus(io, await updatePresence.getAggregateStatus());
    return true;
  }
  if (channel === CHAT_MESSAGE_CREATED_CHANNEL) {
    const parsed = safeParse(deleteMessagePayloadSchema, payload);
    if (!parsed) return false;
    await handleExternallyCreatedMessage(io, parsed);
    return true;
  }
  return false;
}

async function handleExternallyCreatedMessage(io: ChatServer, payload: ChatMessageCreatedEvent) {
  const message = await getMessageById(payload.messageId);
  if (!message || message.conversationId !== payload.conversationId) return;

  const room = getConversationRoom(payload.conversationId);
  io.to(room).to(ADMIN_ROOM).emit(SOCKET_EVENTS.MESSAGE, { message, clientMessageId: message.clientMessageId });

  const conversation = await getConversationById(payload.conversationId);
  if (!conversation) return;
  io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, { conversation });
  if (message.sender === "visitor") {
    io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.NEW_CONVERSATION, { conversation });
  }
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

  socket.on(SOCKET_EVENTS.MESSAGE, async (payload, acknowledge) => {
    const parsed = safeParse(candidateMessageSchema, payload);
    if (!parsed || socket.data.role !== "visitor" || parsed.conversationId !== socket.data.conversationId) {
      acknowledge?.({ error: "Message not authorized or invalid." });
      return;
    }
    try {
      const message = await handleIncomingMessage(io, socket, parsed.conversationId, parsed.content, parsed.clientMessageId);
      acknowledge?.(message ? { message } : { error: "Message rejected. Check the conversation or try again shortly." });
    } catch (error) {
      console.error("[socket] message failed", error);
      acknowledge?.({ error: "Message could not be saved. Please retry." });
    }
  });

  socket.on(SOCKET_EVENTS.REPLY, async (payload, acknowledge) => {
    const parsed = safeParse(adminMessageSchema, payload);
    if (!parsed || socket.data.role !== "admin" || !socket.data.adminId) {
      acknowledge?.({ error: "Message not authorized or invalid." });
      return;
    }
    try {
      const message = await handleAdminReply(io, parsed.conversationId, parsed.content, socket.data.adminId, parsed.clientMessageId);
      acknowledge?.(message ? { message } : { error: "Message rejected. The conversation may be closed." });
    } catch (error) {
      console.error("[socket] reply failed", error);
      acknowledge?.({ error: "Message could not be saved. Please retry." });
    }
  });

  socket.on(SOCKET_EVENTS.TYPING, (payload) => {
    const parsed = safeParse(typingPayloadSchema, payload);
    if (!parsed || (socket.data.role === "visitor" && parsed.conversationId !== socket.data.conversationId)) return;
    broadcastTyping(io, socket, parsed.conversationId, true, typingTimers);
  });

  socket.on(SOCKET_EVENTS.STOP_TYPING, (payload) => {
    const parsed = safeParse(typingPayloadSchema, payload);
    if (!parsed || (socket.data.role === "visitor" && parsed.conversationId !== socket.data.conversationId)) return;
    clearTypingTimer(typingTimers, parsed.conversationId, socket.data.role);
    broadcastTyping(io, socket, parsed.conversationId, false, typingTimers, true);
  });

  socket.on(SOCKET_EVENTS.SET_STATUS, async (payload) => {
    const parsed = safeParse(setStatusPayloadSchema, payload);
    if (!parsed) return;

    const isAdmin = socket.data.role === "admin" && Boolean(socket.data.adminId);
    // A visitor may end their own conversation ("End chat") but never
    // reopen one or touch anyone else's — everything else stays admin-only.
    const isOwnVisitorClosing =
      socket.data.role === "visitor" &&
      parsed.conversationId === socket.data.conversationId &&
      parsed.status === "closed";
    if (!isAdmin && !isOwnVisitorClosing) return;

    await handleSetStatus(io, parsed.conversationId, parsed.status);
  });

  socket.on(SOCKET_EVENTS.DELETE_MESSAGE, async (payload, acknowledge) => {
    const parsed = safeParse(deleteMessagePayloadSchema, payload);
    if (!parsed || socket.data.role !== "admin" || !socket.data.adminId) {
      acknowledge?.({ ok: false, error: "Not authorized to delete this message." });
      return;
    }
    try {
      const result = await handleDeleteMessage(io, parsed.conversationId, parsed.messageId);
      acknowledge?.(result === "not-found" ? { ok: false, error: "Message not found." } : { ok: true });
    } catch (error) {
      console.error("[socket] delete message failed", error);
      acknowledge?.({ ok: false, error: "Message could not be deleted. Please retry." });
    }
  });

  socket.on("chat:delivered", async (payload) => {
    const parsed = safeParse(deleteMessagePayloadSchema, payload);
    if (!parsed || (socket.data.role === "visitor" && parsed.conversationId !== socket.data.conversationId)) return;
    try {
      const message = await getMessageById(parsed.messageId);
      if (!message || message.conversationId !== parsed.conversationId || message.sender === socket.data.role || message.sender === "bot" || message.status !== "sent") return;
      await markMessageDelivered(message.id);
      const updated = await getMessageById(message.id);
      if (updated) io.to(getConversationRoom(parsed.conversationId)).to(ADMIN_ROOM).emit(SOCKET_EVENTS.MESSAGE, { message: updated });
    } catch (error) { console.error("[socket] delivery receipt failed", error); }
  });

  socket.on(SOCKET_EVENTS.READ, async (payload) => {
    const parsed = safeParse(readPayloadSchema, payload);
    if (!parsed || parsed.reader !== socket.data.role ||
        (socket.data.role === "visitor" && parsed.conversationId !== socket.data.conversationId)) return;
    const readAt = new Date().toISOString();
    await markAsRead(parsed.conversationId, parsed.reader);
    io.to(getConversationRoom(parsed.conversationId)).emit("chat:receipt", {
      conversationId: parsed.conversationId, reader: parsed.reader, readAt,
    });
    const conversation = await getConversationById(parsed.conversationId);
    if (conversation) {
      io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, { conversation });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected", { id: socket.id, reason });
    void handleDisconnect(io, socket);
  });
  // Register handlers before any database/Redis await: clients may send immediately.
  void (async () => {
    if (socket.data.role === "admin" && socket.data.adminId) {
      socket.join(ADMIN_ROOM);
      for (const peer of io.sockets.sockets.values()) {
        if (peer.data.role === "visitor" && peer.data.visitorId) socket.emit(SOCKET_EVENTS.PRESENCE, { userId: peer.data.visitorId, online: true });
      }
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
  })().catch((error) => console.error("[socket] presence initialization failed", error));
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

async function handleSetStatus(io: ChatServer, conversationId: string, status: "open" | "closed") {
  const conversation = await updateConversation(conversationId, { status });

  io.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.CONVERSATION_STATUS, {
    conversationId,
    status,
  });
  io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, { conversation });
}

async function handleDeleteMessage(io: ChatServer, conversationId: string, messageId: string) {
  const result = await deleteMessage(messageId, conversationId);
  if (result === "not-found") return result;

  // Broadcast even for "already-deleted" so a concurrent admin tab or the
  // candidate that hasn't seen the first deletion yet still reconciles.
  io.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
    conversationId,
    messageId,
  });

  if (result === "deleted") {
    const conversation = await getConversationById(conversationId);
    if (conversation) {
      io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, { conversation });
    }
  }
  return result;
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

  const conversation = await getConversationById(conversationId);
  if (!conversation || conversation.status === "closed") return;

  const message = await sendMessage({
    conversationId,
    sender: "visitor",
    senderId: socket.data.visitorId,
    content,
    clientMessageId,
  });

  // Broadcast immediately once the message is persisted — everything below
  // (delivered-status flip, admin-list refresh, offline bot reply) is
  // secondary and must never sit in front of the client actually seeing the
  // message. Presence lookups in particular are N+1 Redis round-trips and
  // used to block this emit.
  const room = getConversationRoom(conversationId);
  io.to(room).to(ADMIN_ROOM).emit(SOCKET_EVENTS.MESSAGE, { message, clientMessageId });

  void (async () => {
    const updatedConversation = await getConversationById(conversationId);
    if (!updatedConversation) return;
    io.to(ADMIN_ROOM).emit(SOCKET_EVENTS.NEW_CONVERSATION, { conversation: updatedConversation });

    const aggregateStatus = await updatePresence.getAggregateStatus();

    // Email alerting is decoupled from live presence and handled by the
    // waiting-conversation sweep below — a manually Away/Busy/Offline admin
    // still needs the alert even though they're "aggregate offline" here.
    // The canned bot reply, in contrast, is specifically an offline-only
    // stand-in for a human response.
    if (aggregateStatus === "offline") {
      await sendBotReply(io, conversationId, content);
    }
  })().catch((error) => console.error("[socket] post-broadcast follow-up failed", error));
  return message;
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

  void noteAdminActivity(io, adminId).catch((error) => console.error("[socket] activity update failed", error));

  const existingConversation = await getConversationById(conversationId);
  if (!existingConversation || existingConversation.status === "closed") return;

  const message = await sendMessage({
    conversationId,
    sender: "admin",
    senderId: adminId,
    content,
    clientMessageId,
  });

  io.to(getConversationRoom(conversationId)).to(ADMIN_ROOM).emit(SOCKET_EVENTS.MESSAGE, { message, clientMessageId });

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
  return message;
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
  io.to(room).to(ADMIN_ROOM).emit(SOCKET_EVENTS.MESSAGE, { message, clientMessageId: message.clientMessageId });
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
  const stillConnected = [...io.sockets.sockets.values()].some((other) =>
    other.id !== socket.id && other.data.role === socket.data.role &&
    (socket.data.role === "admin" ? other.data.adminId === socket.data.adminId : other.data.visitorId === socket.data.visitorId)
  );
  if (stillConnected) return;
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
