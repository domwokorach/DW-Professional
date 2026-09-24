import type { ChatSocket } from "@/lib/socket/client";
import type { MessageAcknowledgement } from "@/lib/socket/types";
import type { SendMessagePayload } from "@/types/socket";
import { traceChat } from "@/lib/chat/trace";

/** Retry an uncertain acknowledgement with the SAME id; persistence is idempotent. */
export async function sendClientMessage(socket: ChatSocket | null, payload: SendMessagePayload, visitorId?: string) {
  const cid = payload.clientMessageId;
  const conversationId = payload.conversationId;

  if (socket?.connected) {
    for (let attempt = 0; attempt < 2; attempt++) {
      traceChat("transport:emit", { cid, conversationId, attempt, connected: socket.connected, socketId: socket.id });
      const start = Date.now();
      const result = await new Promise<MessageAcknowledgement | null>((resolve) => {
        const timer = setTimeout(() => resolve(null), 8000);
        const ack = (response: MessageAcknowledgement) => {
          clearTimeout(timer);
          resolve(response);
        };
        if (visitorId) {
          socket.emit("chat:message", payload, ack);
        } else {
          socket.emit("chat:reply", payload, ack);
        }
      });
      const durationMs = Date.now() - start;
      if (result === null) {
        traceChat("transport:ack_timeout", { cid, conversationId, attempt, durationMs });
      } else if (result.error) {
        traceChat("transport:ack", { cid, conversationId, attempt, durationMs, ok: false, error: result.error });
        throw new Error(result.error);
      } else if (result.message) {
        traceChat("transport:ack", { cid, conversationId, attempt, durationMs, ok: true });
        return result.message;
      }
      if (!socket.connected) break;
    }
  }
  // HTTP still persists messages when the independent socket host is unavailable.
  traceChat("transport:fallback_http", { cid, conversationId, connected: socket?.connected ?? false });
  const start = Date.now();
  let response: Response;
  try {
    response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, visitorId }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    traceChat("transport:fallback_result", { cid, conversationId, durationMs: Date.now() - start, ok: false, error: error instanceof Error ? error.message : "network error" });
    throw error;
  }
  const result = await response.json() as MessageAcknowledgement;
  const durationMs = Date.now() - start;
  if (!response.ok || !result.message) {
    traceChat("transport:fallback_result", { cid, conversationId, durationMs, ok: false, error: result.error ?? String(response.status) });
    throw new Error(result.error || "Message failed to send.");
  }
  traceChat("transport:fallback_result", { cid, conversationId, durationMs, ok: true });
  return result.message;
}
