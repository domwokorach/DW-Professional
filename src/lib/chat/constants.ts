export const MAX_MESSAGE_LENGTH = 2_000;

export const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
export const RATE_LIMIT_MAX_MESSAGES = 30;

export const TYPING_DEBOUNCE_MS = 2_000;

export const WELCOME_MESSAGE =
  "Hi 👋 I'm Dominic's live chat. Ask a question and an admin will get back to you — I'll do my best to help in the meantime.";

export const VISITOR_ID_STORAGE_KEY = "live-chat-visitor-id";
export const CONVERSATION_ID_STORAGE_KEY = "live-chat-conversation-id";
export const REGISTERED_STORAGE_KEY = "live-chat-registered";

export const CHAT_ROOMS = {
  ADMINS: "admins",
} as const;

/**
 * Ack/response error for a persistence failure (as opposed to auth, rate
 * limit or a closed conversation). Clients match on this exact text to retry
 * over HTTP, so it must stay identical to what older socket builds send.
 */
export const MESSAGE_SAVE_FAILED_ERROR = "Message could not be saved. Please retry.";
