/**
 * Structured, content-free diagnostics for the send → persist → broadcast →
 * render pipeline (candidate widget, socket server, admin dashboard). Every
 * message already carries a stable `clientMessageId` end-to-end (generated
 * client-side, persisted as a unique column, echoed in every ack/broadcast),
 * so it doubles as the correlation id here — no new id scheme needed.
 *
 * Never pass message content, tokens, or contact details (name/email/mobile)
 * into `fields` — only ids, booleans, counts, durations and timestamps. This
 * runs on both the browser and the standalone socket server, so it can't
 * assume either environment.
 */
export interface ChatTraceFields {
  cid?: string; // clientMessageId — the correlation id for one message's whole journey
  conversationId?: string;
  visitorId?: string;
  adminId?: string;
  socketId?: string;
  role?: string;
  connectionState?: string;
  connected?: boolean;
  attempt?: number;
  ok?: boolean;
  error?: string;
  durationMs?: number;
  [key: string]: string | number | boolean | undefined;
}

export function traceChat(stage: string, fields: ChatTraceFields = {}): void {
  const entry = { at: new Date().toISOString(), stage, ...fields };
  console.log(`[chat:trace] ${stage}`, entry);
}
