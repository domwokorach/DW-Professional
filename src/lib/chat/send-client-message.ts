import type { ChatSocket } from "@/lib/socket/client";
import type { MessageAcknowledgement } from "@/lib/socket/types";
import type { SendMessagePayload } from "@/types/socket";

/** Retry an uncertain acknowledgement with the SAME id; persistence is idempotent. */
export async function sendClientMessage(socket: ChatSocket | null, payload: SendMessagePayload, visitorId?: string) {
  if (socket?.connected) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await new Promise<MessageAcknowledgement | null>((resolve) => {
        socket.timeout(8000).emit(visitorId ? "chat:message" : "chat:reply", payload,
          (error: Error | null, response: MessageAcknowledgement) => resolve(error ? null : response));
      });
      if (result?.error) throw new Error(result.error);
      if (result?.message) return result.message;
      if (!socket.connected) break;
    }
  }
  // HTTP still persists messages when the independent socket host is unavailable.
  const response = await fetch("/api/chat/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, visitorId }),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json() as MessageAcknowledgement;
  if (!response.ok || !result.message) throw new Error(result.error || "Message failed to send.");
  return result.message;
}
