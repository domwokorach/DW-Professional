import { z } from "zod";
import { MAX_MESSAGE_LENGTH } from "./constants";

/** Matches the id the client generates for itself before any conversation exists. */
export const visitorIdSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9-]{1,64}$/, "Invalid visitor id");

export const candidateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
});

export const messageContentSchema = z
  .string()
  .trim()
  .min(1, "Message cannot be empty")
  .max(MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);

export const conversationIdSchema = z.string().trim().min(1, "Conversation id is required");

export const candidateMessageSchema = z.object({
  conversationId: conversationIdSchema,
  content: messageContentSchema,
  clientMessageId: z.string().trim().min(1).optional(),
});

export const adminMessageSchema = z.object({
  conversationId: conversationIdSchema,
  content: messageContentSchema,
  clientMessageId: z.string().trim().min(1).optional(),
});

export const joinPayloadSchema = z.object({
  conversationId: conversationIdSchema,
});

export const typingPayloadSchema = z.object({
  conversationId: conversationIdSchema,
});

export const readPayloadSchema = z.object({
  conversationId: conversationIdSchema,
  reader: z.enum(["visitor", "admin"]),
});

export const createConversationSchema = candidateSchema.extend({
  visitorId: visitorIdSchema,
});

export const conversationStatusSchema = z.enum(["open", "closed"]);

/** Parses `value` against `schema`, returning `null` instead of throwing on failure — the caller decides the HTTP/socket response. */
export function safeParse<T>(schema: z.ZodType<T>, value: unknown): T | null {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}
